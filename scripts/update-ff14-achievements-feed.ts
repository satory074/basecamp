/**
 * FF14 Achievements フィード更新スクリプト
 *
 * Lodestone からアチーブメント一覧をスクレイピングし、
 * public/data/ff14-achievements-feed.json に差分マージする。
 * インクリメンタルキャッシュ: アチーブメントは不変データなのでキャッシュ済みページで停止。
 *
 * GitHub Actions から定期実行される想定。
 *
 * 必要な環境変数:
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";

import { notifyIfNoteworthy } from "./lib/discord-notification";

const JSON_PATH = path.join(process.cwd(), "public/data/ff14-achievements-feed.json");
const CACHE_PATH = path.join(process.cwd(), "public/data/ff14-achievements-cache.json");

const CHARACTER_ID = "27095571";
const LODESTONE_BASE_URL = "https://jp.finalfantasyxiv.com";
const ACHIEVEMENTS_URL = `${LODESTONE_BASE_URL}/lodestone/character/${CHARACTER_ID}/achievement/`;

const FETCH_TIMEOUT = 15000;
const MAX_PAGES = 10;
const MAX_RETRIES = 3;

// ---- Types ----

interface FF14AchievementsCacheEntry {
    date: string;
    title: string;
    cachedAt: string;
}

type FF14AchievementsCache = Record<string, FF14AchievementsCacheEntry>;

interface FF14AchievementEntry {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    date: string;
}

interface FF14AchievementFeedEntry {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: "ff14-achievement";
    description: string;
    thumbnail?: string;
}

interface FF14AchievementsFeedFile {
    lastUpdated: string;
    posts: FF14AchievementFeedEntry[];
}

// ---- Helpers ----

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "ja,en;q=0.9",
                },
                signal: controller.signal,
            });
            return response;
        } catch (error) {
            clearTimeout(timer);
            if (attempt === retries) throw error;
            const backoff = 500 * Math.pow(2, attempt - 1) + Math.random() * 200;
            console.warn(`Attempt ${attempt} failed for ${url}, retrying in ${Math.round(backoff)}ms...`);
            await delay(backoff);
        } finally {
            clearTimeout(timer);
        }
    }
    throw new Error("Unreachable");
}

// ---- Scraping ----

async function scrapeAchievementsPage(pageUrl: string): Promise<{
    entries: FF14AchievementEntry[];
    nextPageUrl: string | null;
}> {
    const response = await fetchWithRetry(pageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch achievements page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const entries: FF14AchievementEntry[] = [];

    $(".entry__achievement").each((_, element) => {
        const $item = $(element);
        const $nameElement = $item.find(".entry__activity__txt");
        const title = $nameElement.text().trim();
        if (!title) return;

        const $link = $item.find("a[href*='/achievement/detail/']");
        const href = $link.attr("href");
        const url = href ? `${LODESTONE_BASE_URL}${href}` : "";

        const $img = $item.find("img");
        const thumbnail = $img.attr("src");

        const idMatch = href?.match(/\/achievement\/detail\/(\d+)\//);
        const achievementId = idMatch ? idMatch[1] : `${Date.now()}-${Math.random()}`;
        const id = `ff14-achievement-${achievementId}`;

        const itemHtml = $.html($item);
        const timestampMatch = itemHtml.match(/ldst_strftime\((\d+),/);
        let date = new Date().toISOString();

        if (timestampMatch && timestampMatch[1]) {
            const unixTimestamp = parseInt(timestampMatch[1]);
            date = new Date(unixTimestamp * 1000).toISOString();
        }

        entries.push({ id, title, url, thumbnail, date });
    });

    let nextPageUrl: string | null = null;
    const $nextLink = $(".btn__pager__next:not(.btn__pager__next--disabled)").find("a");
    if ($nextLink.length > 0) {
        const nextHref = $nextLink.attr("href");
        if (nextHref) {
            nextPageUrl = `${LODESTONE_BASE_URL}${nextHref}`;
        }
    }

    return { entries, nextPageUrl };
}

// ---- Cache ----

function loadCache(): FF14AchievementsCache {
    try {
        return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    } catch {
        return {};
    }
}

function saveAchievementsCache(cache: FF14AchievementsCache): void {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
}

function loadExisting(): FF14AchievementsFeedFile {
    try {
        return JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
    } catch {
        return { lastUpdated: "", posts: [] };
    }
}

// ---- Main ----

async function main() {
    const errors: string[] = [];

    console.log("Fetching FF14 achievements...");

    // Load cache (no expiry — achievements are immutable)
    const cache = loadCache();
    const cachedUrls = new Set(Object.keys(cache));

    // Restore entries from cache
    const cachedResults: FF14AchievementEntry[] = [];
    for (const [url, entry] of Object.entries(cache)) {
        const idMatch = url.match(/\/achievement\/detail\/(\d+)\//);
        const achievementId = idMatch ? idMatch[1] : `cached-${Date.now()}`;
        cachedResults.push({
            id: `ff14-achievement-${achievementId}`,
            title: entry.title,
            url,
            date: entry.date,
        });
    }

    // Incremental scraping: only fetch new entries
    const newEntries: FF14AchievementEntry[] = [];
    let currentUrl: string | null = ACHIEVEMENTS_URL;
    let pageCount = 0;

    while (currentUrl && pageCount < MAX_PAGES) {
        console.log(`Checking page ${pageCount + 1} for new entries...`);

        try {
            const { entries, nextPageUrl } = await scrapeAchievementsPage(currentUrl);
            const pageNewEntries = entries.filter(e => !cachedUrls.has(e.url));

            if (pageNewEntries.length === 0) {
                console.log(`Page ${pageCount + 1} fully cached, stopping`);
                break;
            }

            newEntries.push(...pageNewEntries);
            currentUrl = nextPageUrl;
            pageCount++;
        } catch (error) {
            const msg = `Page ${pageCount + 1} scraping failed: ${error instanceof Error ? error.message : error}`;
            console.error(msg);
            errors.push(msg);
            break;
        }
    }

    // Save new entries to cache
    if (newEntries.length > 0) {
        console.log(`Found ${newEntries.length} new achievements`);
        const updatedCache: FF14AchievementsCache = { ...cache };
        for (const entry of newEntries) {
            updatedCache[entry.url] = {
                date: entry.date,
                title: entry.title,
                cachedAt: new Date().toISOString(),
            };
        }
        saveAchievementsCache(updatedCache);
    } else {
        console.log(`All ${cachedResults.length} achievements from cache`);
    }

    // Convert to feed format
    const allEntries = [...cachedResults, ...newEntries];
    const posts: FF14AchievementFeedEntry[] = allEntries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        url: entry.url,
        date: entry.date,
        platform: "ff14-achievement",
        description: "アチーブメント",
        thumbnail: entry.thumbnail,
    }));

    // Dedup by ID and sort
    const postMap = new Map<string, FF14AchievementFeedEntry>();
    for (const post of posts) {
        postMap.set(post.id, post);
    }

    const merged = Array.from(postMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const existing = loadExisting();
    const newCount = merged.length - existing.posts.length;

    const output: FF14AchievementsFeedFile = {
        lastUpdated: new Date().toISOString(),
        posts: merged,
    };

    fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2) + "\n");
    console.log(`Saved ${merged.length} achievements to ${JSON_PATH}`);

    const newAchievements = Math.max(0, newCount);
    await notifyIfNoteworthy({
        source: "FF14 Achievements",
        status: "success",
        newItems: newAchievements,
        metrics: [
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
        source: "FF14 Achievements",
        status: "error",
        newItems: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
