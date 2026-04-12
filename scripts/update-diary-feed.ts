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
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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

    // Spotify — 曲名・アーティスト名を具体的に渡す
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "spotify-plays.json"), "utf-8"));
        const plays = (data.plays || []) as Array<{ date: string; title?: string; artist?: string }>;
        const todayPlays = plays.filter((p) => new Date(p.date) >= since);
        if (todayPlays.length > 0) {
            const trackList = todayPlays.slice(0, 5)
                .map((p) => `${p.title ?? "?"}(${p.artist ?? "?"})`)
                .join(", ");
            activities.push({
                platform: "Spotify",
                detail: `${todayPlays.length}曲再生: ${trackList}${todayPlays.length > 5 ? " ほか" : ""}`,
            });
        }
    } catch { /* ignore */ }

    // Steam — ゲーム名・実績名を具体的に渡す
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "steam-achievements.json"), "utf-8"));
        const achievements = (data.achievements || []) as Array<{ date: string; title?: string; gameName?: string }>;
        const todayAch = achievements.filter((a) => new Date(a.date) >= since);
        if (todayAch.length > 0) {
            const byGame = new Map<string, string[]>();
            for (const a of todayAch) {
                const game = a.gameName ?? "不明";
                if (!byGame.has(game)) byGame.set(game, []);
                byGame.get(game)!.push(a.title ?? "?");
            }
            const parts: string[] = [];
            for (const [game, titles] of byGame) {
                const shown = titles.slice(0, 3).map(t => `「${t}」`).join("");
                parts.push(`${game}: ${shown}${titles.length > 3 ? `ほか計${titles.length}件` : ""}`);
            }
            activities.push({ platform: "Steam", detail: parts.join(" / ") });
        }
    } catch { /* ignore */ }

    // X (Twitter) — カテゴリ別にツイート内容を渡す
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "x-tweets.json"), "utf-8"));
        const tweets = (Array.isArray(data) ? data : data.tweets || []) as Array<{ date: string; category?: string; description?: string }>;
        const todayTweets = tweets.filter((t) => new Date(t.date) >= since);
        if (todayTweets.length > 0) {
            const parts: string[] = [];
            for (const cat of ["post", "bookmark", "like"] as const) {
                const items = todayTweets.filter((t) => t.category === cat);
                if (items.length === 0) continue;
                const label = cat === "post" ? "投稿" : cat === "bookmark" ? "ブックマーク" : "いいね";
                const descs = items.slice(0, 2)
                    .map((t) => (t.description ?? "").slice(0, 40))
                    .filter(Boolean)
                    .map(d => `「${d}」`);
                if (descs.length > 0) {
                    parts.push(`${label}: ${descs.join("")}${items.length > 2 ? `ほか計${items.length}件` : ""}`);
                } else {
                    parts.push(`${label}${items.length}件`);
                }
            }
            activities.push({ platform: "X", detail: parts.join(" / ") });
        }
    } catch { /* ignore */ }

    // Booklog — タイトルとステータス
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "booklog-feed.json"), "utf-8"));
        const posts = (data.posts || data.entries || []) as Array<{ date: string; title?: string; description?: string }>;
        const todayBooks = posts.filter((e) => new Date(e.date) >= since);
        if (todayBooks.length > 0) {
            const bookDetails = todayBooks.slice(0, 3)
                .map((b) => {
                    const status = b.description ?? "";
                    return `「${b.title ?? "?"}」${status ? `(${status})` : ""}`;
                });
            activities.push({
                platform: "Booklog",
                detail: bookDetails.join("、") + (todayBooks.length > 3 ? `ほか計${todayBooks.length}冊` : ""),
            });
        }
    } catch { /* ignore */ }

    // Filmarks — タイトルと評価
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "filmarks-feed.json"), "utf-8"));
        const posts = (data.posts || data.entries || []) as Array<{ date: string; title?: string; description?: string; rating?: number }>;
        const todayFilms = posts.filter((e) => new Date(e.date) >= since);
        if (todayFilms.length > 0) {
            const filmDetails = todayFilms.slice(0, 3)
                .map((f) => {
                    const ratingStr = f.rating ? `★${f.rating}` : "";
                    const typeStr = f.description ?? "";
                    return `「${f.title ?? "?"}」${[typeStr, ratingStr].filter(Boolean).join(" ")}`;
                });
            activities.push({
                platform: "Filmarks",
                detail: filmDetails.join("、") + (todayFilms.length > 3 ? `ほか計${todayFilms.length}作品` : ""),
            });
        }
    } catch { /* ignore */ }

    // FF14 Achievements — 実績名を渡す
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, "ff14-achievements-feed.json"), "utf-8"));
        const posts = (data.posts || data.entries || []) as Array<{ date: string; title?: string }>;
        const todayAch = posts.filter((e) => new Date(e.date) >= since);
        if (todayAch.length > 0) {
            const titles = todayAch.slice(0, 3).map(a => `「${a.title ?? "?"}」`).join("");
            activities.push({
                platform: "FF14",
                detail: `実績解除: ${titles}${todayAch.length > 3 ? `ほか計${todayAch.length}件` : ""}`,
            });
        }
    } catch { /* ignore */ }

    return activities;
}

// ---- Get previous diary for continuity ----

function getPreviousDiarySummary(): string | null {
    try {
        const feed = loadDiaryFeed();
        if (feed.entries.length === 0) return null;
        const lastContent = feed.entries[0].content;
        // 最後の一文を返す
        const sentences = lastContent.split(/[。！？\n]/).filter(s => s.trim().length > 0);
        return sentences.length > 0 ? sentences[sentences.length - 1].trim() : null;
    } catch {
        return null;
    }
}

// ---- Gemini API ----

async function generateDiaryEntry(activities: ActivityItem[], dateStr: string, previousDiary: string | null): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
    }

    const activityText = activities.length > 0
        ? activities.map((a) => `- ${a.platform}: ${a.detail}`).join("\n")
        : "（今日は特に記録された活動なし）";

    const previousContext = previousDiary
        ? `\n前日の日記の最後の一文: 「${previousDiary}」`
        : "";

    const prompt = `あなたはユーザーの親しい友人で、毎日の活動を見て気軽に話しかけるように日記を書く人です。
以下の活動データをもとに、二人称で友達に話しかけるようなカジュアルな日本語の日記を150〜300字で書いてください。
${activities.length === 0 ? "活動データがない日は、休息や静かな一日について短く（50〜80字）書いてください。" : ""}
条件：
- 親しい友人の口調で書く（〜だよね、〜じゃん、〜してたね、ナイス！、〜じゃない？ など）
- 具体的なコンテンツ名（曲名、記事タイトル、ゲーム名、実績名など）をそのまま引用し、その内容に踏み込んだ感想・リアクション・ツッコミを書く
- 「〜聴いてたね」「〜読んでたね」のような表面的な言及ではなく、「この曲の○○なところが〜」「このタイトル気になる、○○系？」のように内容に一歩踏み込む
- 共感・ツッコミ・応援のいずれかを必ず含める
- 活動を箇条書きで羅列せず、会話のような自然な流れで書く
- 活動がない項目は無理に含めない
- 日付・タイトルは含めず、本文だけ出力する
- **重要**: 活動データに含まれていない情報（存在しない曲名・ゲーム名・記事タイトル等）は絶対に捏造しないこと

--- 出力例（このトーンと具体性のレベルを参考にしてください） ---

入力: Spotify: 5曲再生: め組のひと(Rats&Star), 風になる(Tsuji Ayano), RUSH(JO1) ほか / X: ブックマーク: 「メルカリのClaude Codeセキュリティ設定の組織展開戦略」 / いいね: 「中島裕翔＆新木優子が結婚発表」

出力: 「め組のひと」と「風になる」が同じプレイリストに入ってるの、昭和と令和のいいとこ取りって感じでセンスいいよね。JO1の「RUSH」も混ざってるし、テンション上げたい気分だったのかな？メルカリのClaude Codeセキュリティ記事をブックマークしてたけど、組織展開って書いてあるからチームで導入しようとしてる？攻めてるね〜。あと中島裕翔と新木優子の結婚ニュースにいいねしてたの見たよ、あのふたりお似合いだよね！

---
${previousContext}
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
                    maxOutputTokens: 4096,
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
        candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
            finishReason?: string;
        }>;
    };
    const candidate = data.candidates?.[0];
    // gemini-2.5-flash はシンキングモデル: parts の最後のテキストを取得
    const parts = candidate?.content?.parts ?? [];
    const text = parts.filter(p => p.text).map(p => p.text).join("").trim();

    if (!text) {
        const reason = candidate?.finishReason ?? "unknown";
        throw new Error(`Gemini API returned empty response (finishReason: ${reason})`);
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
    const jstOffset = 9 * 60 * 60 * 1000;

    // TARGET_DATE=YYYY-MM-DD で過去日付の日記を生成可能
    let now: Date;
    let jstNow: Date;
    if (process.env.TARGET_DATE) {
        // TARGET_DATE を JST の終わり (23:59 JST) として扱う
        jstNow = new Date(`${process.env.TARGET_DATE}T23:59:59+09:00`);
        now = new Date(jstNow.getTime() - jstOffset);
    } else {
        now = new Date();
        jstNow = new Date(now.getTime() + jstOffset);
    }

    const dateKey = jstNow.toISOString().slice(0, 10); // YYYY-MM-DD
    const entryId = `diary-${dateKey}`;

    console.log(`Generating diary entry for ${dateKey}...`);

    // Load existing feed
    const feed = loadDiaryFeed();

    // Idempotency: skip if entry already exists
    if (feed.entries.some((e) => e.id === entryId)) {
        console.log(`Entry ${entryId} already exists, skipping.`);
        return;
    }

    // Collect activities
    console.log("Collecting activities...");
    const activities = collectTodayActivities(now);
    console.log(`Found ${activities.length} active platforms`);

    // Get previous diary for continuity
    const previousDiary = getPreviousDiarySummary();
    if (previousDiary) {
        console.log(`Previous diary context: ${previousDiary.slice(0, 40)}...`);
    }

    // Generate diary with Gemini (活動0件でも短い日記を生成)
    const jpDateStr = formatJpDate(jstNow);
    console.log("Generating diary entry with Gemini...");
    const content = await generateDiaryEntry(activities, jpDateStr, previousDiary);
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
