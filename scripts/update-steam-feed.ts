/**
 * Steam フィード更新スクリプト
 *
 * Steam Web API から最近プレイしたゲームの実績を取得し、
 * public/data/steam-achievements.json に差分マージする。
 *
 * GitHub Actions から定期実行される想定。
 *
 * 必要な環境変数:
 *   STEAM_API_KEY    - Steam Web API キー
 *   STEAM_USER_ID    - Steam ユーザー ID (64bit)
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import * as fs from "fs";
import * as path from "path";

import { notifyIfNoteworthy } from "./lib/discord-notification";

const JSON_PATH = path.join(process.cwd(), "public/data/steam-achievements.json");

// Steam Web API endpoints
const RECENTLY_PLAYED_URL = "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/";
const OWNED_GAMES_URL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/";
const PLAYER_ACHIEVEMENTS_URL = "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/";
const GAME_SCHEMA_URL = "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/";

const FETCH_TIMEOUT = 10000;
const API_DELAY_MS = 500;
const BATCH_SIZE = 3;

// ---- Types ----

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

interface AchievementEntry {
    id: string;
    appId: number;
    gameName: string;
    title: string;
    icon: string;
    date: string;
}

interface SteamAchievementsFile {
    steamId: string;
    lastUpdated: string;
    achievements: AchievementEntry[];
}

// ---- Helpers ----

function getApiKey(): string {
    const key = process.env.STEAM_API_KEY;
    if (!key) throw new Error("STEAM_API_KEY is not set");
    return key;
}

function getUserId(): string {
    const id = process.env.STEAM_USER_ID;
    if (!id) throw new Error("STEAM_USER_ID is not set");
    return id;
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

// ---- Steam API ----

async function fetchGames(): Promise<SteamGame[]> {
    const apiKey = getApiKey();
    const userId = getUserId();

    // Try recently played first
    const recentUrl = `${RECENTLY_PLAYED_URL}?key=${apiKey}&steamid=${userId}&count=10&format=json`;
    const recentResponse = await fetchWithTimeout(recentUrl, FETCH_TIMEOUT);

    if (recentResponse.ok) {
        const recentData = await recentResponse.json() as {
            response?: { games?: SteamGame[] };
        };
        const recentGames = recentData.response?.games || [];
        if (recentGames.length > 0) {
            console.log(`Found ${recentGames.length} recently played games`);
            return recentGames;
        }
    }

    // Fallback: all owned games (Steam Deck offline play doesn't update
    // "recently played", so we check all games for new achievements)
    console.log("No recently played games, falling back to all owned games");
    const ownedUrl = `${OWNED_GAMES_URL}?key=${apiKey}&steamid=${userId}&include_appinfo=1&include_played_free_games=1&format=json`;
    const ownedResponse = await fetchWithTimeout(ownedUrl, FETCH_TIMEOUT);

    if (!ownedResponse.ok) {
        throw new Error(`GetOwnedGames failed: ${ownedResponse.status}`);
    }

    const ownedData = await ownedResponse.json() as {
        response?: { games?: SteamGame[] };
    };

    return ownedData.response?.games || [];
}

async function fetchPlayerAchievements(appid: number): Promise<SteamAchievement[]> {
    const url = `${PLAYER_ACHIEVEMENTS_URL}?appid=${appid}&key=${getApiKey()}&steamid=${getUserId()}&l=japanese`;
    const response = await fetchWithTimeout(url, FETCH_TIMEOUT);

    if (!response.ok) {
        return [];
    }

    const data = await response.json() as {
        playerstats?: { achievements?: SteamAchievement[] };
    };

    return (data.playerstats?.achievements || []).filter(a => a.achieved === 1);
}

async function fetchGameSchema(appid: number): Promise<SteamSchemaAchievement[]> {
    const url = `${GAME_SCHEMA_URL}?appid=${appid}&key=${getApiKey()}&l=japanese`;
    const response = await fetchWithTimeout(url, FETCH_TIMEOUT);

    if (!response.ok) {
        return [];
    }

    const data = await response.json() as {
        game?: {
            availableGameStats?: {
                achievements?: SteamSchemaAchievement[];
            };
        };
    };

    return data.game?.availableGameStats?.achievements || [];
}

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

// ---- Load & Save ----

function loadExisting(): SteamAchievementsFile {
    try {
        const content = fs.readFileSync(JSON_PATH, "utf-8");
        return JSON.parse(content);
    } catch {
        return {
            steamId: getUserId(),
            lastUpdated: "",
            achievements: [],
        };
    }
}

// ---- Main ----

async function main() {
    const errors: string[] = [];

    console.log("Fetching Steam games...");
    const games = await fetchGames();
    console.log(`Found ${games.length} games to process`);

    if (games.length === 0) {
        console.log("No games found, exiting");
        await notifyIfNoteworthy({
            source: "Steam",
            status: "warning",
            newItems: 0,
            metrics: [
                { name: "Games Processed", value: 0 },
            ],
            errors: ["No games found"],
        });
        return;
    }

    // Fetch achievements for each game
    console.log("Fetching achievements...");
    const achievementResults = await processBatches(games, async (game) => {
        const achievements = await fetchPlayerAchievements(game.appid);
        return { game, achievements };
    });

    const gamesWithAchievements = achievementResults.filter(r => r.achievements.length > 0);
    console.log(`${gamesWithAchievements.length} games have achievements`);

    if (gamesWithAchievements.length === 0) {
        console.log("No achievements found");
        await notifyIfNoteworthy({
            source: "Steam",
            status: "success",
            newItems: 0,
            metrics: [
                { name: "Games Processed", value: games.length },
                { name: "New Achievements", value: 0 },
                { name: "Total Achievements", value: 0 },
            ],
            errors,
        });
        return;
    }

    // Fetch schemas for games with achievements
    await delay(API_DELAY_MS);
    console.log("Fetching game schemas...");
    const schemaResults = await processBatches(gamesWithAchievements, async ({ game }) => {
        const schemas = await fetchGameSchema(game.appid);
        return { appid: game.appid, schemas };
    });

    // Build schema lookup
    const schemaLookup = new Map<string, SteamSchemaAchievement>();
    for (const { appid, schemas } of schemaResults) {
        for (const sch of schemas) {
            schemaLookup.set(`${appid}:${sch.name}`, sch);
        }
    }

    // Convert to AchievementEntry[]
    const freshEntries: AchievementEntry[] = [];
    for (const { game, achievements } of gamesWithAchievements) {
        for (const ach of achievements) {
            const schema = schemaLookup.get(`${game.appid}:${ach.apiname}`);
            freshEntries.push({
                id: `steam-${game.appid}-${ach.apiname}`,
                appId: game.appid,
                gameName: game.name,
                title: schema?.displayName || ach.apiname,
                icon: schema?.icon || "",
                date: new Date(ach.unlocktime * 1000).toISOString(),
            });
        }
    }

    // Merge with existing (dedup by ID)
    const existing = loadExisting();
    const entryMap = new Map<string, AchievementEntry>();
    for (const entry of existing.achievements) {
        entryMap.set(entry.id, entry);
    }
    for (const entry of freshEntries) {
        entryMap.set(entry.id, entry);
    }

    // Sort by date descending
    const merged = Array.from(entryMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const newCount = merged.length - existing.achievements.length;

    const output: SteamAchievementsFile = {
        steamId: getUserId(),
        lastUpdated: new Date().toISOString(),
        achievements: merged,
    };

    fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2) + "\n");
    console.log(`Saved ${merged.length} achievements to ${JSON_PATH}`);

    if (newCount > 0) {
        console.log(`Added ${newCount} new achievements`);
    } else {
        console.log("No new achievements");
    }

    const newAchievements = Math.max(0, newCount);
    await notifyIfNoteworthy({
        source: "Steam",
        status: "success",
        newItems: newAchievements,
        metrics: [
            { name: "Games Processed", value: games.length },
            { name: "New Achievements", value: `+${newAchievements}` },
            { name: "Total Achievements", value: merged.length },
        ],
        errors,
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await notifyIfNoteworthy({
        source: "Steam",
        status: "error",
        newItems: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
