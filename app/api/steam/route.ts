import { NextResponse, NextRequest } from "next/server";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { fetchWithTimeout } from "../../lib/fetch-with-timeout";
import {
    loadCache,
    saveCache,
    isCacheValid,
    type SteamSchemaCache,
} from "../../lib/cache-utils";

export const revalidate = 21600; // ISR: 6時間ごとに再検証

function getSteamApiKey(): string {
    return process.env.STEAM_API_KEY || "";
}

function getSteamUserId(): string {
    return process.env.STEAM_USER_ID || "";
}

const STEAM_ACHIEVEMENTS_CACHE_FILE = "steam-achievements-cache.json";
const STEAM_SCHEMA_CACHE_FILE = "steam-schema-cache.json";

// Steam Web API endpoints
const RECENTLY_PLAYED_URL = "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/";
const OWNED_GAMES_URL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/";
const PLAYER_ACHIEVEMENTS_URL = "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/";
const GAME_SCHEMA_URL = "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/";

const FETCH_TIMEOUT = 10000;

// Rate limit: 1 req/sec recommended by Steam (reduced for serverless environments)
const API_DELAY_MS = 500;
const BATCH_SIZE = 3; // Concurrent requests per batch

interface SteamGame {
    appid: number;
    name: string;
    playtime_2weeks?: number;
    playtime_forever?: number;
    img_icon_url?: string;
}

interface SteamAchievement {
    apiname: string;
    achieved: number;
    unlocktime: number;
}

interface SteamSchemaAchievement {
    name: string;
    displayName: string;
    description?: string;
    icon: string;
    icongray: string;
}

interface AchievementsCacheData {
    posts: Post[];
    cachedAt: string;
}

type AchievementsCacheFile = Record<string, AchievementsCacheData>;

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 最近プレイしたゲームを取得。空の場合は所有ゲーム（プレイ時間順）にフォールバック
 */
async function fetchGames(): Promise<SteamGame[]> {
    // まず最近プレイしたゲームを試す
    const recentUrl = `${RECENTLY_PLAYED_URL}?key=${getSteamApiKey()}&steamid=${getSteamUserId()}&count=10&format=json`;
    const recentResponse = await fetchWithTimeout(recentUrl, { timeoutMs: FETCH_TIMEOUT });

    if (recentResponse.ok) {
        const recentData = await recentResponse.json() as {
            response?: { games?: SteamGame[] };
        };
        const recentGames = recentData.response?.games || [];
        if (recentGames.length > 0) {
            return recentGames;
        }
    }

    // フォールバック: 所有ゲームをプレイ時間順で取得
    console.log("Steam: No recently played games, falling back to owned games");
    const ownedUrl = `${OWNED_GAMES_URL}?key=${getSteamApiKey()}&steamid=${getSteamUserId()}&include_appinfo=1&include_played_free_games=1&format=json`;
    const ownedResponse = await fetchWithTimeout(ownedUrl, { timeoutMs: FETCH_TIMEOUT });

    if (!ownedResponse.ok) {
        throw new Error(`GetOwnedGames failed: ${ownedResponse.status}`);
    }

    const ownedData = await ownedResponse.json() as {
        response?: { games?: SteamGame[] };
    };

    const ownedGames = ownedData.response?.games || [];
    // プレイ時間があるゲームのみ、プレイ時間降順で上位15件
    return ownedGames
        .filter(g => (g.playtime_forever || 0) > 0)
        .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
        .slice(0, 15);
}

/**
 * ゲームの実績を取得（achieved=1のみ）
 */
async function fetchPlayerAchievements(appid: number): Promise<SteamAchievement[]> {
    const url = `${PLAYER_ACHIEVEMENTS_URL}?appid=${appid}&key=${getSteamApiKey()}&steamid=${getSteamUserId()}&l=japanese`;
    const response = await fetchWithTimeout(url, { timeoutMs: FETCH_TIMEOUT });

    if (!response.ok) {
        // Some games don't have achievements
        return [];
    }

    const data = await response.json() as {
        playerstats?: { achievements?: SteamAchievement[] };
    };

    return (data.playerstats?.achievements || []).filter(a => a.achieved === 1);
}

/**
 * ゲームスキーマから実績の表示名・アイコンを取得（キャッシュ活用）
 */
async function fetchGameSchema(
    appid: number,
    schemaCache: SteamSchemaCache
): Promise<{ achievements: SteamSchemaAchievement[]; updatedCache: SteamSchemaCache }> {
    // Check if all needed schemas might be cached already
    // We fetch the full schema anyway since we don't know which achievements we need yet
    const url = `${GAME_SCHEMA_URL}?appid=${appid}&key=${getSteamApiKey()}&l=japanese`;
    const response = await fetchWithTimeout(url, { timeoutMs: FETCH_TIMEOUT });

    if (!response.ok) {
        return { achievements: [], updatedCache: schemaCache };
    }

    const data = await response.json() as {
        game?: {
            availableGameStats?: {
                achievements?: SteamSchemaAchievement[];
            };
        };
    };

    const achievements = data.game?.availableGameStats?.achievements || [];

    // Cache each achievement's schema
    const updatedCache = { ...schemaCache };
    for (const ach of achievements) {
        const cacheKey = `${appid}:${ach.name}`;
        if (!updatedCache[cacheKey]) {
            updatedCache[cacheKey] = {
                displayName: ach.displayName,
                description: ach.description || "",
                icon: ach.icon,
                cachedAt: new Date().toISOString(),
            };
        }
    }

    return { achievements, updatedCache };
}

/**
 * バッチ処理ヘルパー: 配列をBATCH_SIZEごとに処理
 */
async function processBatches<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);
        if (i + BATCH_SIZE < items.length) {
            await delay(API_DELAY_MS);
        }
    }
    return results;
}

/**
 * Steam実績をPost形式で取得（キャッシュ活用）
 */
async function fetchSteamAchievements(): Promise<Post[]> {
    // メインキャッシュ確認（1日TTL）
    const achievementsCache = await loadCache<AchievementsCacheFile>(STEAM_ACHIEVEMENTS_CACHE_FILE);
    const cachedData = achievementsCache["latest"];
    if (cachedData && isCacheValid(cachedData.cachedAt, 1)) {
        console.log(`Steam: Using ${cachedData.posts.length} cached achievement posts`);
        return cachedData.posts;
    }

    console.log("Steam: Fetching fresh data from Steam API");

    // スキーマキャッシュ読み込み（恒久キャッシュ）
    let schemaCache = await loadCache<SteamSchemaCache>(STEAM_SCHEMA_CACHE_FILE);

    // 1. ゲーム一覧を取得（最近プレイ or 所有ゲーム）
    const games = await fetchGames();
    if (games.length === 0) {
        return [];
    }

    // 2. 各ゲームの実績をバッチ取得
    const achievementResults = await processBatches(games, async (game) => {
        const achievements = await fetchPlayerAchievements(game.appid);
        return { game, achievements };
    });

    // 実績があるゲームのみフィルタ
    const gamesWithAchievements = achievementResults.filter(r => r.achievements.length > 0);

    if (gamesWithAchievements.length === 0) {
        return [];
    }

    // 3. スキーマをバッチ取得（実績があるゲームのみ）
    await delay(API_DELAY_MS);
    const schemaResults = await processBatches(gamesWithAchievements, async ({ game }) => {
        const result = await fetchGameSchema(game.appid, schemaCache);
        return { appid: game.appid, ...result };
    });

    // スキーマキャッシュを統合
    for (const result of schemaResults) {
        schemaCache = { ...schemaCache, ...result.updatedCache };
    }

    // 4. 実績をPost形式に変換
    const allPosts: Post[] = [];
    for (const { game, achievements } of gamesWithAchievements) {
        // スキーマMapを構築
        const schemaResult = schemaResults.find(r => r.appid === game.appid);
        const schemaMap = new Map<string, SteamSchemaAchievement>();
        if (schemaResult) {
            for (const ach of schemaResult.achievements) {
                schemaMap.set(ach.name, ach);
            }
        }

        for (const ach of achievements) {
            const cacheKey = `${game.appid}:${ach.apiname}`;
            const cached = schemaCache[cacheKey];
            const schema = schemaMap.get(ach.apiname);

            const displayName = cached?.displayName || schema?.displayName || ach.apiname;
            const icon = cached?.icon || schema?.icon || "";

            allPosts.push({
                id: `steam-${game.appid}-${ach.apiname}`,
                title: displayName,
                url: `https://store.steampowered.com/app/${game.appid}`,
                date: new Date(ach.unlocktime * 1000).toISOString(),
                platform: "steam",
                description: game.name,
                thumbnail: icon || undefined,
            });
        }
    }

    // 日付降順ソート
    allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // キャッシュ保存（失敗しても問題なし）
    await saveCache<AchievementsCacheFile>(STEAM_ACHIEVEMENTS_CACHE_FILE, {
        latest: {
            posts: allPosts,
            cachedAt: new Date().toISOString(),
        },
    });
    await saveCache(STEAM_SCHEMA_CACHE_FILE, schemaCache);

    return allPosts;
}

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

export async function GET(request: NextRequest) {
    const { success, remaining } = await limiter(request);

    if (!success) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
                status: 429,
                headers: {
                    "X-RateLimit-Limit": "60",
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                },
            }
        );
    }

    try {
        if (!getSteamApiKey() || !getSteamUserId()) {
            console.warn("Steam: STEAM_API_KEY or STEAM_USER_ID not set");
            const jsonResponse = NextResponse.json([]);
            jsonResponse.headers.set("X-Steam-Debug", "missing-env-vars");
            return jsonResponse;
        }

        const posts = await fetchSteamAchievements();

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        jsonResponse.headers.set("X-Steam-Debug", `ok:${posts.length}`);
        return jsonResponse;
    } catch (error) {
        console.error("Steam API error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        const jsonResponse = NextResponse.json([]);
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        jsonResponse.headers.set("X-Steam-Debug", `error:${message.substring(0, 100)}`);
        return jsonResponse;
    }
}
