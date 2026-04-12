/**
 * AI日記生成スクリプト
 *
 * 各プラットフォームの過去24時間のアクティビティデータを収集し、
 * Gemini API で二人称の日本語日記エントリを生成して
 * public/data/diary-feed.json に保存する。
 *
 * GitHub Actions から日次で実行される想定。
 *
 * 必要な環境変数:
 *   GEMINI_API_KEY - Gemini API キー
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import * as fs from "fs";
import * as path from "path";

const DIARY_JSON_PATH = path.join(process.cwd(), "public/data/diary-feed.json");
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_ENTRIES = 365; // 1年分保持

// ---- Types ----

interface DiaryEntry {
    id: string;
    date: string;
    title: string;
    content: string;
}

interface DiaryFeedData {
    lastUpdated: string;
    entries: DiaryEntry[];
}

interface ActivityItem {
    platform: string;
    detail: string;
}

// ---- Load existing data ----

function loadDiaryFeed(): DiaryFeedData {
    try {
        const content = fs.readFileSync(DIARY_JSON_PATH, "utf-8");
        return JSON.parse(content) as DiaryFeedData;
    } catch {
        return { lastUpdated: new Date().toISOString(), entries: [] };
    }
}

// ---- Collect Activity Data (past 24h) ----

function collectTodayActivities(targetDate: Date): ActivityItem[] {
    const activities: ActivityItem[] = [];
    const dataDir = path.join(process.cwd(), "public/data");
    const since = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);

    // Duolingo
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "duolingo-stats.json"), "utf-8"));
        const entries = (data.entries || []) as Array<{ date: string; xpGained?: number; streak?: number; category?: string }>;
        const todayEntries = entries.filter((e) => new Date(e.date) >= since);
        if (todayEntries.length > 0) {
            const totalXp = todayEntries.reduce((sum, e) => sum + (e.xpGained ?? 0), 0);
            const streak = data.currentStats?.streak ?? 0;
            activities.push({
                platform: "Duolingo",
                detail: `${totalXp}XP獲得（連続${streak}日）`,
            });
        }
    } catch { /* ignore */ }

    // Spotify
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "spotify-plays.json"), "utf-8"));
        const plays = (data.plays || []) as Array<{ date: string; title?: string; artist?: string }>;
        const todayPlays = plays.filter((p) => new Date(p.date) >= since);
        if (todayPlays.length > 0) {
            const artists = [...new Set(todayPlays.map((p) => p.artist).filter(Boolean))].slice(0, 3);
            activities.push({
                platform: "Spotify",
                detail: `${todayPlays.length}曲再生（${artists.join("、")}など）`,
            });
        }
    } catch { /* ignore */ }

    // Steam
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "steam-achievements.json"), "utf-8"));
        const achievements = (data.achievements || []) as Array<{ date: string; title?: string; gameName?: string }>;
        const todayAch = achievements.filter((a) => new Date(a.date) >= since);
        if (todayAch.length > 0) {
            const games = [...new Set(todayAch.map((a) => a.gameName).filter(Boolean))].slice(0, 2);
            activities.push({
                platform: "Steam",
                detail: `「${games.join("」「")}」で実績${todayAch.length}件解除`,
            });
        }
    } catch { /* ignore */ }

    // X (Twitter)
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "x-tweets.json"), "utf-8"));
        const tweets = (Array.isArray(data) ? data : data.tweets || []) as Array<{ date: string; category?: string }>;
        const todayTweets = tweets.filter((t) => new Date(t.date) >= since);
        if (todayTweets.length > 0) {
            const posts = todayTweets.filter((t) => t.category === "post").length;
            const likes = todayTweets.filter((t) => t.category === "like").length;
            const parts: string[] = [];
            if (posts > 0) parts.push(`投稿${posts}件`);
            if (likes > 0) parts.push(`いいね${likes}件`);
            activities.push({ platform: "X", detail: parts.join("、") });
        }
    } catch { /* ignore */ }

    // Booklog
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "booklog-feed.json"), "utf-8"));
        const entries = (data.entries || data || []) as Array<{ date: string; title?: string }>;
        const todayBooks = entries.filter((e) => new Date(e.date) >= since);
        if (todayBooks.length > 0) {
            const titles = todayBooks.slice(0, 2).map((b) => b.title).filter(Boolean);
            activities.push({
                platform: "Booklog",
                detail: `「${titles.join("」「")}」など${todayBooks.length}冊を記録`,
            });
        }
    } catch { /* ignore */ }

    // Filmarks
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "filmarks-feed.json"), "utf-8"));
        const entries = (data.entries || data || []) as Array<{ date: string; title?: string }>;
        const todayFilms = entries.filter((e) => new Date(e.date) >= since);
        if (todayFilms.length > 0) {
            const titles = todayFilms.slice(0, 2).map((f) => f.title).filter(Boolean);
            activities.push({
                platform: "Filmarks",
                detail: `「${titles.join("」「")}」など${todayFilms.length}作品を視聴`,
            });
        }
    } catch { /* ignore */ }

    // FF14 Achievements
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "ff14-achievements-feed.json"), "utf-8"));
        const entries = (data.entries || data || []) as Array<{ date: string; title?: string }>;
        const todayAch = entries.filter((e) => new Date(e.date) >= since);
        if (todayAch.length > 0) {
            activities.push({
                platform: "FF14",
                detail: `実績${todayAch.length}件解除`,
            });
        }
    } catch { /* ignore */ }

    return activities;
}

// ---- Gemini API ----

async function generateDiaryEntry(activities: ActivityItem[], dateStr: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
    }

    const activityText = activities
        .map((a) => `- ${a.platform}: ${a.detail}`)
        .join("\n");

    const prompt = `あなたは個人ポートフォリオサイトの日記を書くナレーターです。
以下の今日の活動データをもとに、二人称（「あなたは〜した」「あなたは〜だった」）で、
自然でカジュアルな日本語の日記を150〜300字で書いてください。

条件：
- 二人称（「あなたは」を主語に）で書く
- 硬すぎず、少し詩的・観察的なトーンで
- 活動を羅列するのではなく、その日の雰囲気や流れが伝わるように
- 活動がない項目は無理に含めなくて構わない
- 日付・タイトルは含めず、本文だけ出力する

活動データ（${dateStr}）：
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
                    temperature: 0.9,
                    maxOutputTokens: 512,
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
    title: string;
    content: string;
    error?: string;
}): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const color = params.error ? 0xff0000 : 0xD97706;
    const fields = params.error
        ? [{ name: "Error", value: params.error.slice(0, 1000), inline: false }]
        : [
            { name: "タイトル", value: params.title, inline: false },
            { name: "内容", value: params.content.slice(0, 500), inline: false },
        ];

    const embed = {
        title: `Diary Update: ${params.error ? "Error" : "Success"}`,
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

// ---- Format date ----

function formatJpDate(date: Date): string {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${m}月${d}日`;
}

// ---- Main ----

async function main() {
    const now = new Date();
    // Use JST date for the diary entry ID/title
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstNow = new Date(now.getTime() + jstOffset);
    const dateKey = jstNow.toISOString().slice(0, 10); // YYYY-MM-DD
    const entryId = `diary-${dateKey}`;

    console.log(`Generating diary entry for ${dateKey}...`);

    // Load existing feed
    const feed = loadDiaryFeed();

    // Idempotency: skip if today's entry already exists
    if (feed.entries.some((e) => e.id === entryId)) {
        console.log(`Entry ${entryId} already exists, skipping.`);
        return;
    }

    // Collect activities
    console.log("Collecting today's activities...");
    const activities = collectTodayActivities(now);
    console.log(`Found ${activities.length} active platforms`);

    if (activities.length === 0) {
        console.log("No activity data found for today, skipping diary generation.");
        return;
    }

    // Generate diary with Gemini
    const jpDateStr = formatJpDate(jstNow);
    console.log("Generating diary entry with Gemini...");
    const content = await generateDiaryEntry(activities, jpDateStr);
    console.log(`Generated: ${content.slice(0, 80)}...`);

    const title = `${jpDateStr}の日記`;
    const entry: DiaryEntry = {
        id: entryId,
        date: now.toISOString(),
        title,
        content,
    };

    // Merge and save
    feed.entries.unshift(entry);
    feed.entries = feed.entries.slice(0, MAX_ENTRIES);
    feed.lastUpdated = now.toISOString();

    fs.writeFileSync(DIARY_JSON_PATH, JSON.stringify(feed, null, 2) + "\n");
    console.log(`Saved to ${DIARY_JSON_PATH}`);

    await sendDiscordNotification({ title, content });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await sendDiscordNotification({ title: "", content: "", error: errorMsg }).catch(() => {});
    process.exit(1);
});
