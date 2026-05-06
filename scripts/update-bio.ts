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

import { notifyDiscord } from "./lib/discord-notification";
import { readFeed, writeFeed } from "./lib/feed-storage";

const FEED_FILE = "bio.json";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

async function tryRead<T>(filename: string): Promise<T | null> {
    try {
        return await readFeed<T>(filename);
    } catch {
        return null;
    }
}

async function collectActivities(): Promise<ActivitySummary[]> {
    const activities: ActivitySummary[] = [];

    const duo = await tryRead<{ currentStats: { streak: number; totalXp: number; courses?: { title: string }[] } }>("duolingo-stats.json");
    if (duo) {
        const stats = duo.currentStats;
        const courses = (stats.courses || []).map((c) => c.title).join(", ");
        activities.push({
            platform: "Duolingo",
            count: stats.streak,
            details: `${stats.streak}日連続ストリーク、総XP ${stats.totalXp}、学習中: ${courses}`,
        });
    }

    const x = await tryRead<{ tweets?: { category?: string }[] } | { category?: string }[]>("x-tweets.json");
    if (x) {
        const tweets = Array.isArray(x) ? x : x.tweets ?? [];
        const posts = tweets.filter((t) => t.category === "post").length;
        const likes = tweets.filter((t) => t.category === "like").length;
        const bookmarks = tweets.filter((t) => t.category === "bookmark").length;
        activities.push({
            platform: "X",
            count: tweets.length,
            details: `投稿${posts}件、いいね${likes}件、ブックマーク${bookmarks}件`,
        });
    }

    const steam = await tryRead<{ achievements?: { gameName?: string }[] } | { gameName?: string }[]>("steam-achievements.json");
    if (steam) {
        const achievements = Array.isArray(steam) ? steam : steam.achievements ?? [];
        const games = new Set(achievements.map((a) => a.gameName)).size;
        activities.push({
            platform: "Steam",
            count: achievements.length,
            details: `${games}本のゲームで${achievements.length}件の実績を獲得`,
        });
    }

    const booklog = await tryRead<unknown[]>("booklog-cache.json");
    if (Array.isArray(booklog)) {
        activities.push({
            platform: "Booklog",
            count: booklog.length,
            details: `${booklog.length}冊の読書記録`,
        });
    }

    const filmarks = await tryRead<unknown[]>("filmarks-cache.json");
    if (Array.isArray(filmarks)) {
        activities.push({
            platform: "Filmarks",
            count: filmarks.length,
            details: `${filmarks.length}本の映画・ドラマの視聴記録`,
        });
    }

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

// ---- Main ----

async function main() {
    console.log("Collecting activity data...");
    const activities = await collectActivities();
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

    await writeFeed(FEED_FILE, output);
    console.log(`Saved to ${FEED_FILE}`);

    await notifyDiscord({
        source: "Bio",
        status: "success",
        metrics: [{ name: "Bio", value: bio.slice(0, 1000), inline: false }],
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await notifyDiscord({
        source: "Bio",
        status: "error",
        errors: [errorMsg],
    }).catch(() => {});
    process.exit(1);
});
