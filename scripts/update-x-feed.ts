/**
 * X (Twitter) フィード更新スクリプト
 *
 * X API v2 (OAuth 2.0 PKCE) を使用して、自分のツイート・いいね・ブックマークを取得し、
 * public/data/x-tweets.json にマージ保存する。
 *
 * GitHub Actions から定期実行される想定。
 *
 * 必要な環境変数:
 *   X_CLIENT_ID       - X Developer App の Client ID
 *   X_CLIENT_SECRET    - X Developer App の Client Secret（Confidential Client の場合）
 *   X_REFRESH_TOKEN    - OAuth 2.0 Refresh Token
 *   X_USER_ID          - X ユーザーID（数値）
 *   GH_PAT             - GitHub Personal Access Token（refresh token 更新用、GitHub Actions のみ）
 *   GITHUB_REPOSITORY  - owner/repo（GitHub Actions が自動設定）
 */

import * as fs from "fs";
import * as path from "path";

const X_API_BASE = "https://api.x.com/2";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const USERNAME = "satory074";
const JSON_PATH = path.join(process.cwd(), "public/data/x-tweets.json");

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

interface XTweetData {
    id: string;
    text: string;
    created_at?: string;
}

interface XApiResponse {
    data?: XTweetData[];
    meta?: {
        result_count: number;
        next_token?: string;
    };
}

interface TweetEntry {
    id: string;
    date: string;
    category: "post" | "like" | "bookmark";
    description?: string;
    isRetweet?: boolean;
}

interface XTweetsFile {
    username: string;
    tweets: TweetEntry[];
}

// ---- Token Management ----

async function refreshAccessToken(): Promise<{ accessToken: string; newRefreshToken: string }> {
    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;
    const refreshToken = process.env.X_REFRESH_TOKEN;

    if (!clientId || !refreshToken) {
        throw new Error("Missing X_CLIENT_ID or X_REFRESH_TOKEN environment variables");
    }

    const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
    });

    const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
    };

    // Confidential Client の場合は Basic Auth を使用
    if (clientSecret) {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        headers["Authorization"] = `Basic ${credentials}`;
    }

    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers,
        body: params.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed (${response.status}): ${errorText}`);
    }

    const data: TokenResponse = await response.json();
    return {
        accessToken: data.access_token,
        newRefreshToken: data.refresh_token,
    };
}

async function updateGitHubSecret(newRefreshToken: string): Promise<void> {
    const ghPat = process.env.GH_PAT;
    const repo = process.env.GITHUB_REPOSITORY;

    if (!ghPat || !repo) {
        console.warn("GH_PAT or GITHUB_REPOSITORY not set, skipping refresh token update in GitHub Secrets");
        console.log("New refresh token (save manually):", newRefreshToken);
        return;
    }

    // gh CLI を使って Secret を更新 (spawnSync でシェルインジェクション回避)
    const { spawnSync } = await import("child_process");
    const result = spawnSync(
        "gh",
        ["secret", "set", "X_REFRESH_TOKEN", "--repo", repo, "--body", newRefreshToken],
        {
            env: { ...process.env, GH_TOKEN: ghPat },
            stdio: "pipe",
        }
    );
    if (result.status !== 0) {
        const stderr = result.stderr?.toString() ?? "";
        console.error("Failed to update GitHub Secret:", stderr);
        console.log("New refresh token (save manually):", newRefreshToken);
        throw new Error(`gh secret set failed (exit ${result.status}): ${stderr}`);
    }
    console.log("Updated X_REFRESH_TOKEN in GitHub Secrets");
}

// ---- X API Fetching ----

async function fetchFromXApi(
    url: string,
    accessToken: string,
): Promise<XTweetData[]> {
    const results: XTweetData[] = [];
    let nextToken: string | undefined;

    // 最大2ページまで取得（APIレート制限を考慮）
    for (let page = 0; page < 2; page++) {
        const fetchUrl = new URL(url);
        fetchUrl.searchParams.set("max_results", "10");
        fetchUrl.searchParams.set("tweet.fields", "created_at,text");
        if (nextToken) {
            fetchUrl.searchParams.set("pagination_token", nextToken);
        }

        const response = await fetch(fetchUrl.toString(), {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API request failed (${response.status}): ${errorText}`);
            break;
        }

        const data: XApiResponse = await response.json();
        if (data.data) {
            results.push(...data.data);
        }

        nextToken = data.meta?.next_token;
        if (!nextToken) break;
    }

    return results;
}

async function fetchUserTweets(userId: string, accessToken: string): Promise<TweetEntry[]> {
    const tweets = await fetchFromXApi(
        `${X_API_BASE}/users/${userId}/tweets`,
        accessToken,
    );

    return tweets.map((t) => ({
        id: t.id,
        date: t.created_at || new Date().toISOString(),
        category: "post" as const,
        description: t.text,
        isRetweet: t.text.startsWith("RT @"),
    }));
}

async function fetchUserLikes(userId: string, accessToken: string): Promise<TweetEntry[]> {
    const tweets = await fetchFromXApi(
        `${X_API_BASE}/users/${userId}/liked_tweets`,
        accessToken,
    );

    return tweets.map((t) => ({
        id: t.id,
        date: t.created_at || new Date().toISOString(),
        category: "like" as const,
        description: t.text,
    }));
}

async function fetchUserBookmarks(userId: string, accessToken: string): Promise<TweetEntry[]> {
    const tweets = await fetchFromXApi(
        `${X_API_BASE}/users/${userId}/bookmarks`,
        accessToken,
    );

    return tweets.map((t) => ({
        id: t.id,
        date: t.created_at || new Date().toISOString(),
        category: "bookmark" as const,
        description: t.text,
    }));
}

// ---- Merge & Save ----

function loadExistingTweets(): XTweetsFile {
    try {
        const content = fs.readFileSync(JSON_PATH, "utf-8");
        return JSON.parse(content);
    } catch {
        return { username: USERNAME, tweets: [] };
    }
}

function mergeTweets(existing: TweetEntry[], newTweets: TweetEntry[]): TweetEntry[] {
    const map = new Map<string, TweetEntry>();

    // 既存を先にセット
    for (const tweet of existing) {
        map.set(tweet.id, tweet);
    }

    // 新規で上書き（同じIDなら新しいデータを優先）
    for (const tweet of newTweets) {
        map.set(tweet.id, tweet);
    }

    // 日付降順でソート
    return Array.from(map.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
}

// ---- Discord Notification ----

async function sendDiscordNotification(params: {
    tweets: number;
    likes: number;
    bookmarks: number;
    totalMerged: number;
    newCount: number;
    errors: string[];
}): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const hasErrors = params.errors.length > 0;
    const isZeroFetch = params.tweets === 0 && params.likes === 0 && params.bookmarks === 0;

    const color = hasErrors ? 0xff0000 : isZeroFetch ? 0xffaa00 : 0x00c853;
    const status = hasErrors ? "Error" : isZeroFetch ? "Warning: 0 件取得" : "Success";

    const fields = [
        { name: "Tweets", value: `${params.tweets}`, inline: true },
        { name: "Likes", value: `${params.likes}`, inline: true },
        { name: "Bookmarks", value: `${params.bookmarks}`, inline: true },
        { name: "Total", value: `${params.totalMerged} (${params.newCount >= 0 ? "+" : ""}${params.newCount} new)`, inline: false },
    ];

    if (params.errors.length > 0) {
        fields.push({
            name: "Errors",
            value: params.errors.join("\n").slice(0, 1000),
            inline: false,
        });
    }

    const embed = {
        title: `X Feed Update: ${status}`,
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
    const userId = process.env.X_USER_ID;
    if (!userId) {
        throw new Error("X_USER_ID environment variable is required");
    }

    const errors: string[] = [];

    console.log("Refreshing access token...");
    const { accessToken, newRefreshToken } = await refreshAccessToken();

    // Refresh token をローテーション保存
    await updateGitHubSecret(newRefreshToken);

    console.log("Fetching tweets, likes, and bookmarks...");
    const [tweets, likes, bookmarks] = await Promise.all([
        fetchUserTweets(userId, accessToken).catch((e: unknown) => {
            const msg = `Failed to fetch tweets: ${e instanceof Error ? e.message : String(e)}`;
            console.error(msg);
            errors.push(msg);
            return [] as TweetEntry[];
        }),
        fetchUserLikes(userId, accessToken).catch((e: unknown) => {
            const msg = `Failed to fetch likes: ${e instanceof Error ? e.message : String(e)}`;
            console.error(msg);
            errors.push(msg);
            return [] as TweetEntry[];
        }),
        fetchUserBookmarks(userId, accessToken).catch((e: unknown) => {
            const msg = `Failed to fetch bookmarks: ${e instanceof Error ? e.message : String(e)}`;
            console.error(msg);
            errors.push(msg);
            return [] as TweetEntry[];
        }),
    ]);

    console.log(`Fetched: ${tweets.length} tweets, ${likes.length} likes, ${bookmarks.length} bookmarks`);

    const existing = loadExistingTweets();
    const allNew = [...tweets, ...likes, ...bookmarks];
    const merged = mergeTweets(existing.tweets, allNew);

    const output: XTweetsFile = {
        username: USERNAME,
        tweets: merged,
    };

    fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2) + "\n");
    console.log(`Saved ${merged.length} tweets to ${JSON_PATH}`);

    const newCount = merged.length - existing.tweets.length;
    if (newCount > 0) {
        console.log(`Added ${newCount} new entries`);
    } else {
        console.log("No new entries");
    }

    await sendDiscordNotification({
        tweets: tweets.length,
        likes: likes.length,
        bookmarks: bookmarks.length,
        totalMerged: merged.length,
        newCount,
        errors,
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await sendDiscordNotification({
        tweets: 0,
        likes: 0,
        bookmarks: 0,
        totalMerged: 0,
        newCount: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
