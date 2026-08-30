/**
 * Gemini API (generateContent) の共通ヘルパー。
 *
 * - 429 / 503 は 60s × attempt の待ちで最大 3 回リトライ
 * - thinking モデル (gemini-2.5-*) は parts が複数返るので text を全て連結する
 * - `generateJson` は JSON mode (`responseMimeType: application/json`) で呼び、コードフェンスが混ざっても剥がす
 *
 * 環境変数: GEMINI_API_KEY (必須), GEMINI_MODEL (任意)
 */

export interface GeminiOptions {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    /** JSON mode 用のスキーマ (Gemini の responseSchema 形式) */
    responseSchema?: Record<string, unknown>;
    /** thinking モデルの思考トークン上限。0 で思考オフ */
    thinkingBudget?: number;
    maxRetries?: number;
}

export class GeminiError extends Error {
    constructor(message: string, public readonly status?: number) {
        super(message);
        this.name = "GeminiError";
    }
}

const DEFAULT_MODEL = "gemini-2.5-flash";

function apiUrl(model: string): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

interface GenerateContentResponse {
    candidates?: Array<{
        content?: { parts?: Array<{ text?: string; thought?: boolean }> };
        finishReason?: string;
    }>;
    promptFeedback?: { blockReason?: string };
}

export async function generateText(prompt: string, options: GeminiOptions = {}): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new GeminiError("GEMINI_API_KEY environment variable is required");

    const model = options.model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const maxRetries = options.maxRetries ?? 3;

    const generationConfig: Record<string, unknown> = {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 1024,
    };
    if (options.responseSchema) {
        generationConfig.responseMimeType = "application/json";
        generationConfig.responseSchema = options.responseSchema;
    }
    if (options.thinkingBudget !== undefined) {
        generationConfig.thinkingConfig = { thinkingBudget: options.thinkingBudget };
    }

    let response: Response | null = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        response = await fetch(`${apiUrl(model)}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
        });
        if (response.ok) break;

        if ((response.status === 429 || response.status === 503) && attempt < maxRetries - 1) {
            const waitSec = 60 * (attempt + 1);
            console.log(`Gemini retryable error (${response.status}), retrying in ${waitSec}s... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
            continue;
        }
        const errorText = await response.text();
        throw new GeminiError(`Gemini API failed (${response.status}): ${errorText.slice(0, 500)}`, response.status);
    }
    if (!response || !response.ok) throw new GeminiError("Gemini API failed after retries");

    const data = (await response.json()) as GenerateContentResponse;
    const candidate = data.candidates?.[0];
    const text = (candidate?.content?.parts ?? [])
        .filter((p) => p.text && !p.thought)
        .map((p) => p.text)
        .join("")
        .trim();
    if (!text) {
        const reason = candidate?.finishReason ?? data.promptFeedback?.blockReason ?? "unknown";
        throw new GeminiError(`Gemini API returned empty response (finishReason: ${reason})`);
    }
    return text;
}

function stripCodeFence(text: string): string {
    const m = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return m ? m[1] : text;
}

export async function generateJson<T>(prompt: string, options: GeminiOptions = {}): Promise<T> {
    const raw = await generateText(prompt, { temperature: 0.2, ...options });
    const cleaned = stripCodeFence(raw.trim());
    try {
        return JSON.parse(cleaned) as T;
    } catch {
        throw new GeminiError(`Gemini returned non-JSON output: ${cleaned.slice(0, 200)}`);
    }
}
