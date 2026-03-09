/**
 * LLM 他己紹介生成スクリプト
 *
 * 各プラットフォームの最近の活動データを収集し、Gemini API で
 * ユーザーの他己紹介を生成して public/data/bio.json に保存する。
 *
 * GitHub Actions から週次で実行される想定。
 *
 * 必要な環境変数:
 *   GEMINI_API_KEY - Gemini API キー
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import * as fs from "fs";
import * as path from "path";

const JSON_PATH = path.join(process.cwd(), "public/data/bio.json");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// ---- Types ----

interface BioFile {
    bio: string;
    updatedAt: string;
}

interface ActivitySummary {
    platform: string;
    count: number;
    details: string;
}

// ---- Collect Activity Data ----

function collectActivities(): ActivitySummary[] {
    const activities: ActivitySummary[] = [];
    const dataDir = path.join(process.cwd(), "public/data");

    // Duolingo
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "duolingo-stats.json"), "utf-8"));
        const stats = data.currentStats;
        const courses = (stats.courses || []).map((c: { title: string }) => c.title).join(", ");
        activities.push({
            platform: "Duolingo",
            count: stats.streak,
            details: `${stats.streak}日連続ストリーク、総XP ${stats.totalXp}、学習中: ${courses}`,
        });
    } catch { /* ignore */ }

    // X (Twitter)
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "x-tweets.json"), "utf-8"));
        const tweets = Array.isArray(data) ? data : data.tweets || [];
        const posts = tweets.filter((t: { category?: string }) => t.category === "post").length;
        const likes = tweets.filter((t: { category?: string }) => t.category === "like").length;
        const bookmarks = tweets.filter((t: { category?: string }) => t.category === "bookmark").length;
        activities.push({
            platform: "X",
            count: tweets.length,
            details: `投稿${posts}件、いいね${likes}件、ブックマーク${bookmarks}件`,
        });
    } catch { /* ignore */ }

    // Steam
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "steam-achievements.json"), "utf-8"));
        const achievements = Array.isArray(data) ? data : data.achievements || [];
        const games = new Set(achievements.map((a: { gameName?: string }) => a.gameName)).size;
        activities.push({
            platform: "Steam",
            count: achievements.length,
            details: `${games}本のゲームで${achievements.length}件の実績を獲得`,
        });
    } catch { /* ignore */ }

    // Booklog cache
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "booklog-cache.json"), "utf-8"));
        const books = Array.isArray(data) ? data : [];
        activities.push({
            platform: "Booklog",
            count: books.length,
            details: `${books.length}冊の読書記録`,
        });
    } catch { /* ignore */ }

    // Filmarks cache
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "filmarks-cache.json"), "utf-8"));
        const films = Array.isArray(data) ? data : [];
        activities.push({
            platform: "Filmarks",
            count: films.length,
            details: `${films.length}本の映画・ドラマの視聴記録`,
        });
    } catch { /* ignore */ }

    return activities;
}

// ---- Gemini API ----

async function generateBio(activities: ActivitySummary[]): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
    }

    const activityText = activities
        .map((a) => `- ${a.platform}: ${a.details}`)
        .join("\n");

    const prompt = `あなたはポートフォリオサイトのプロフィール文を書くライターです。
以下のユーザーの活動データから、このユーザーを100〜150字で他己紹介してください。

条件：
- 三人称（「彼は」等）ではなく、活動内容を主語にした客観的な紹介文
- 硬すぎず柔らかすぎない、ナチュラルなトーン
- 特徴的な活動や数字を自然に盛り込む
- 日本語で出力

活動データ：
${activityText}`;

    const MAX_RETRIES = 3;
    let response: Response | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 256,
                },
            }),
        });

        if (response.ok) break;

        if (response.status === 429 && attempt < MAX_RETRIES - 1) {
            const waitSec = 60 * (attempt + 1);
            console.log(`Rate limited (429), retrying in ${waitSec}s... (attempt ${attempt + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, waitSec * 1000));
            continue;
        }

        const errorText = await response.text();
        throw new Error(`Gemini API failed (${response.status}): ${errorText}`);
    }

    if (!response || !response.ok) {
        throw new Error("Gemini API failed after retries");
    }

    const data = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
        throw new Error("Gemini API returned empty response");
    }

    return text;
}

// ---- Discord Notification ----

async function sendDiscordNotification(params: {
    bio: string;
    error?: string;
}): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const color = params.error ? 0xff0000 : 0x4285f4;
    const fields = params.error
        ? [{ name: "Error", value: params.error.slice(0, 1000), inline: false }]
        : [{ name: "Bio", value: params.bio.slice(0, 1000), inline: false }];

    const embed = {
        title: `Bio Update: ${params.error ? "Error" : "Success"}`,
        color,
        fields,
        timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
    }).catch((e: unknown) => console.error("Discord notification failed:", e));
}

// ---- Main ----

async function main() {
    console.log("Collecting activity data...");
    const activities = collectActivities();
    console.log(`Found ${activities.length} activity sources`);

    if (activities.length === 0) {
        console.log("No activity data found, skipping bio generation");
        return;
    }

    console.log("Generating bio with Gemini...");
    const bio = await generateBio(activities);
    console.log(`Generated bio: ${bio}`);

    const output: BioFile = {
        bio,
        updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2) + "\n");
    console.log(`Saved to ${JSON_PATH}`);

    await sendDiscordNotification({ bio });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await sendDiscordNotification({ bio: "", error: errorMsg }).catch(() => {});
    process.exit(1);
});
