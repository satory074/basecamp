/**
 * Steam フィード更新スクリプト
 *
 * Steam Web API から最近プレイしたゲームの実績を取得し、
 * public/data/steam-achievements.json に差分マージする。
 *
 * 日本語化: 実績名・説明文は `l=japanese` で日本語版を取る (隠し実績は説明文が API に無い)。
 * ゲーム名は Web API が英語しか返さないので、ストアの appdetails (`l=japanese`) から取り、
 * ファイルの `gameNames` にキャッシュする (日本語版の無いゲームはストアの表記のまま)。
 *
 * GitHub Actions から定期実行される想定。
 *
 * 必要な環境変数:
 *   STEAM_API_KEY    - Steam Web API キー
 *   STEAM_USER_ID    - Steam ユーザー ID (64bit)
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import { notifyIfNoteworthy } from "./lib/discord-notification";
import { readFeed, writeFeed } from "./lib/feed-storage";

const FEED_FILE = "steam-achievements.json";

// Steam Web API endpoints
const RECENTLY_PLAYED_URL = "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/";
const OWNED_GAMES_URL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/";
const PLAYER_ACHIEVEMENTS_URL = "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/";
const GAME_SCHEMA_URL = "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/";
const STORE_APPDETAILS_URL = "https://store.steampowered.com/api/appdetails";

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
    /** ストアの日本語名 (取れなければ Web API の英語名) */
    gameName: string;
    title: string;
    /** 実績の説明文 (ja)。隠し実績など説明の無いものは ""。undefined は未取得 (次回 run でスキーマから埋める) */
    detail?: string;
    icon: string;
    date: string;
}

interface SteamAchievementsFile {
    steamId: string;
    lastUpdated: string;
    /** appId → ストアの日本語名のキャッシュ */
    gameNames?: Record<string, string>;
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

/** ストアの日本語名。ストアから消えたゲームなどで取れなければ null */
async function fetchJapaneseGameName(appid: number): Promise<string | null> {
    const url = `${STORE_APPDETAILS_URL}?appids=${appid}&l=japanese&filters=basic`;
    const response = await fetchWithTimeout(url, FETCH_TIMEOUT);
    if (!response.ok) return null;
    const data = await response.json() as Record<string, { success?: boolean; data?: { name?: string } } | undefined>;
    const entry = data[String(appid)];
    return entry?.success ? entry.data?.name?.trim() || null : null;
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

async function loadExisting(): Promise<SteamAchievementsFile> {
    return readFeed<SteamAchievementsFile>(FEED_FILE, {
        steamId: getUserId(),
        lastUpdated: "",
        achievements: [],
    });
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

    const existing = await loadExisting();

    // スキーマ (日本語の実績名・説明文・アイコン) は、今回実績が取れたゲーム + 説明文をまだ埋めていない既存エントリのゲーム
    const schemaAppIds = new Set<number>(gamesWithAchievements.map(({ game }) => game.appid));
    for (const entry of existing.achievements) {
        if (entry.detail === undefined) schemaAppIds.add(entry.appId);
    }

    await delay(API_DELAY_MS);
    console.log(`Fetching game schemas for ${schemaAppIds.size} games...`);
    const schemaResults = await processBatches([...schemaAppIds], async (appid) => {
        const schemas = await fetchGameSchema(appid);
        return { appid, schemas };
    });

    // Build schema lookup
    const schemaLookup = new Map<string, SteamSchemaAchievement>();
    const schemaFetched = new Set<number>();
    for (const { appid, schemas } of schemaResults) {
        if (schemas.length > 0) schemaFetched.add(appid);
        for (const sch of schemas) {
            schemaLookup.set(`${appid}:${sch.name}`, sch);
        }
    }

    // ゲーム名: ストアの日本語名 (未取得のゲームだけ引いてキャッシュ)
    const gameNames: Record<string, string> = { ...(existing.gameNames ?? {}) };
    const allAppIds = new Set<number>([
        ...existing.achievements.map((a) => a.appId),
        ...gamesWithAchievements.map(({ game }) => game.appid),
    ]);
    const apiGameNames = new Map(gamesWithAchievements.map(({ game }) => [game.appid, game.name]));
    const missingNames = [...allAppIds].filter((id) => !gameNames[String(id)]);
    if (missingNames.length > 0) {
        console.log(`Fetching Japanese store names for ${missingNames.length} games...`);
        const names = await processBatches(missingNames, async (appid) => ({ appid, name: await fetchJapaneseGameName(appid) }));
        for (const { appid, name } of names) {
            if (name) {
                gameNames[String(appid)] = name;
                continue;
            }
            // ストアから消えたゲームなど。毎回引き直さないよう Web API の名前をキャッシュしておく
            const fallback = apiGameNames.get(appid) ?? existing.achievements.find((a) => a.appId === appid)?.gameName;
            console.warn(`Store name not found for app ${appid}, keeping "${fallback}"`);
            if (fallback) gameNames[String(appid)] = fallback;
        }
    }
    const gameNameOf = (appid: number, fallback: string) => gameNames[String(appid)] ?? apiGameNames.get(appid) ?? fallback;

    // Convert to AchievementEntry[]
    const freshEntries: AchievementEntry[] = [];
    for (const { game, achievements } of gamesWithAchievements) {
        for (const ach of achievements) {
            const schema = schemaLookup.get(`${game.appid}:${ach.apiname}`);
            freshEntries.push({
                id: `steam-${game.appid}-${ach.apiname}`,
                appId: game.appid,
                gameName: gameNameOf(game.appid, game.name),
                title: schema?.displayName || ach.apiname,
                detail: schema?.description ?? "",
                icon: schema?.icon || "",
                date: new Date(ach.unlocktime * 1000).toISOString(),
            });
        }
    }

    // Merge with existing (dedup by ID)。既存エントリもゲーム名・説明文を日本語で埋め直す
    const entryMap = new Map<string, AchievementEntry>();
    for (const entry of existing.achievements) {
        const schema = schemaLookup.get(`${entry.appId}:${entry.id.slice(`steam-${entry.appId}-`.length)}`);
        entryMap.set(entry.id, {
            ...entry,
            gameName: gameNameOf(entry.appId, entry.gameName),
            title: schema?.displayName || entry.title,
            detail: schemaFetched.has(entry.appId) ? schema?.description ?? "" : entry.detail,
            icon: schema?.icon || entry.icon,
        });
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
        gameNames,
        achievements: merged,
    };

    await writeFeed(FEED_FILE, output);
    console.log(`Saved ${merged.length} achievements to ${FEED_FILE}`);

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
