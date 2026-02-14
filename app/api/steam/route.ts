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

const STEAM_API_KEY = process.env.STEAM_API_KEY || "";
const STEAM_USER_ID = process.env.STEAM_USER_ID || "";

const STEAM_ACHIEVEMENTS_CACHE_FILE = "steam-achievements-cache.json";
const STEAM_SCHEMA_CACHE_FILE = "steam-schema-cache.json";

// Steam Web API endpoints
const RECENTLY_PLAYED_URL = "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/";
const PLAYER_ACHIEVEMENTS_URL = "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/";
const GAME_SCHEMA_URL = "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/";

const FETCH_TIMEOUT = 10000;

// Rate limit: 1 req/sec recommended by Steam
const API_DELAY_MS = 1100;

interface SteamRecentGame {
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
 * 最近プレイしたゲームを取得
 */
async function fetchRecentlyPlayedGames(): Promise<SteamRecentGame[]> {
    const url = `${RECENTLY_PLAYED_URL}?key=${STEAM_API_KEY}&steamid=${STEAM_USER_ID}&count=10&format=json`;
    const response = await fetchWithTimeout(url, { timeoutMs: FETCH_TIMEOUT });

    if (!response.ok) {
        throw new Error(`GetRecentlyPlayedGames failed: ${response.status}`);
    }

    const data = await response.json() as {
        response?: { games?: SteamRecentGame[] };
    };

    return data.response?.games || [];
}

/**
 * ゲームの実績を取得（achieved=1のみ）
 */
async function fetchPlayerAchievements(appid: number): Promise<SteamAchievement[]> {
    const url = `${PLAYER_ACHIEVEMENTS_URL}?appid=${appid}&key=${STEAM_API_KEY}&steamid=${STEAM_USER_ID}&l=japanese`;
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
    const url = `${GAME_SCHEMA_URL}?appid=${appid}&key=${STEAM_API_KEY}&l=japanese`;
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

    // 1. 最近プレイしたゲームを取得
    const recentGames = await fetchRecentlyPlayedGames();
    if (recentGames.length === 0) {
        return [];
    }

    const allPosts: Post[] = [];

    // 2. 各ゲームの実績を取得
    for (const game of recentGames) {
        await delay(API_DELAY_MS);

        const achievements = await fetchPlayerAchievements(game.appid);
        if (achievements.length === 0) continue;

        await delay(API_DELAY_MS);

        // 3. スキーマから表示名・アイコンを取得
        const { achievements: schemaAchievements, updatedCache } = await fetchGameSchema(game.appid, schemaCache);
        schemaCache = updatedCache;

        // スキーマをMapに変換
        const schemaMap = new Map<string, SteamSchemaAchievement>();
        for (const ach of schemaAchievements) {
            schemaMap.set(ach.name, ach);
        }

        // 4. 実績をPost形式に変換
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

    // キャッシュ保存
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
        if (!STEAM_API_KEY || !STEAM_USER_ID) {
            console.warn("Steam: STEAM_API_KEY or STEAM_USER_ID not set");
            return NextResponse.json([]);
        }

        const posts = await fetchSteamAchievements();

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        console.error("Steam API error:", error);
        const jsonResponse = NextResponse.json([]);
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    }
}
