/**
 * Filmarks フィード更新スクリプト
 *
 * Filmarks の映画・ドラマ・アニメのマーク一覧をスクレイピングし、
 * 各エントリの詳細日時を取得して public/data/filmarks-feed.json に保存する。
 *
 * GitHub Actions から定期実行される想定。
 *
 * 必要な環境変数:
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";

const JSON_PATH = path.join(process.cwd(), "public/data/filmarks-feed.json");
const CACHE_PATH = path.join(process.cwd(), "public/data/filmarks-cache.json");

const FILMARKS_USERNAME = "satory074";
const FILMARKS_BASE_URL = "https://filmarks.com";
const MOVIES_URL = `${FILMARKS_BASE_URL}/users/${FILMARKS_USERNAME}/marks`;
const DRAMAS_URL = `${FILMARKS_BASE_URL}/users/${FILMARKS_USERNAME}/marks/dramas`;
const ANIMES_URL = `${FILMARKS_BASE_URL}/users/${FILMARKS_USERNAME}/marks/animes`;

const FETCH_TIMEOUT = 15000;
const BATCH_SIZE = 5;
const MAX_RETRIES = 3;

// ---- Types ----

interface FilmarksCacheEntry {
    date: string;
    title: string;
    cachedAt: string;
}

type FilmarksCache = Record<string, FilmarksCacheEntry>;

interface FilmarksEntry {
    id: string;
    title: string;
    url: string;
    thumbnail: string | undefined;
    rating: number | undefined;
    contentType: "movie" | "drama" | "anime";
}

interface FilmarksFeedEntry {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: "filmarks";
    description: string;
    thumbnail?: string;
    rating?: number;
}

interface FilmarksFeedFile {
    lastUpdated: string;
    posts: FilmarksFeedEntry[];
}

// ---- Helpers ----

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const COMMON_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
};

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        try {
            const response = await fetch(url, {
                headers: COMMON_HEADERS,
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

async function scrapeFilmarksPage(url: string, contentType: "movie" | "drama" | "anime"): Promise<FilmarksEntry[]> {
    try {
        const response = await fetchWithRetry(url);
        if (!response.ok) {
            console.error(`Filmarks fetch failed: ${response.status} for ${url}`);
            return [];
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const entries: FilmarksEntry[] = [];
        const seenIds = new Set<string>();

        $("div.c-content-card").each((_, element) => {
            const $card = $(element);
            const $titleLink = $card.find("h3.c-content-card__title a").first();
            const href = $titleLink.attr("href");

            if (!href) return;

            const isMovie = href.includes("/movies/");
            const isDrama = href.includes("/dramas/");
            const isAnime = href.includes("/animes/");

            if (contentType === "movie" && !isMovie) return;
            if (contentType === "drama" && !isDrama) return;
            if (contentType === "anime" && !isAnime) return;
            if (!href.includes("mark_id=")) return;

            const markIdMatch = href.match(/mark_id=(\d+)/);
            const id = markIdMatch ? `filmarks-${contentType}-${markIdMatch[1]}` : `filmarks-${contentType}-${Date.now()}`;

            if (seenIds.has(id)) return;
            seenIds.add(id);

            let title = $titleLink.text().trim();
            title = title.replace(/\(\d{4}年製作の(映画|ドラマ|TVアニメ)\)/, "").trim();
            if (!title) return;

            const $img = $card.find("a.c-content__jacket img").first();
            let thumbnail: string | undefined = $img.attr("src");
            if (thumbnail && thumbnail.startsWith("http:")) {
                thumbnail = thumbnail.replace(/^http:/, "https:");
            }

            const ratingText = $card.find("div.c-rating__score").first().text().trim();
            const rating = ratingText ? parseFloat(ratingText) : undefined;

            const fullUrl = href.startsWith("http") ? href : `${FILMARKS_BASE_URL}${href}`;

            entries.push({ id, title, url: fullUrl, thumbnail, rating: rating && !isNaN(rating) ? rating : undefined, contentType });
        });

        return entries;
    } catch (error) {
        console.error(`Error scraping Filmarks ${contentType}:`, error);
        return [];
    }
}

async function fetchMarkDate(url: string): Promise<string | null> {
    try {
        const response = await fetchWithRetry(url);
        if (!response.ok) return null;

        const html = await response.text();
        const usernamePattern = new RegExp(
            `${FILMARKS_USERNAME}[\\s\\S]*?(\\d{4}\\/(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])\\s+\\d{2}:\\d{2})`,
            'i'
        );
        let match = html.match(usernamePattern);

        if (!match) {
            const fallbackPattern = /(\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\s+\d{2}:\d{2})/;
            match = html.match(fallbackPattern);
        }

        if (match && match[1]) {
            const dateStr = match[1].replace(/\//g, '-').replace(' ', 'T') + ':00+09:00';
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) return date.toISOString();
        }

        console.warn(`Failed to extract mark date from ${url}`);
        return null;
    } catch (error) {
        console.warn(`Error fetching mark date from ${url}:`, error instanceof Error ? error.message : error);
        return null;
    }
}

// ---- Cache ----

function loadCache(): FilmarksCache {
    try {
        return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    } catch {
        return {};
    }
}

function saveFilmarksCache(cache: FilmarksCache): void {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
}

function loadExisting(): FilmarksFeedFile {
    try {
        return JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
    } catch {
        return { lastUpdated: "", posts: [] };
    }
}

function isCacheValid(cachedAt: string, maxAgeDays = 30): boolean {
    const diff = (Date.now() - new Date(cachedAt).getTime()) / (1000 * 60 * 60 * 24);
    return diff < maxAgeDays;
}

// ---- Discord ----

async function sendDiscordNotification(params: {
    newPosts: number;
    totalPosts: number;
    errors: string[];
}): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const hasErrors = params.errors.length > 0;
    const color = hasErrors ? 0xff0000 : params.newPosts > 0 ? 0x00aa00 : 0x888888;
    const status = hasErrors ? "Error" : params.newPosts > 0 ? "Success" : "No new posts";

    const fields = [
        { name: "New Posts", value: `+${params.newPosts}`, inline: true },
        { name: "Total Posts", value: `${params.totalPosts}`, inline: true },
    ];

    if (params.totalPosts === 0 && !hasErrors) {
        fields.push({ name: "Warning", value: "0 posts fetched — scraping may have failed", inline: false });
    }

    if (params.errors.length > 0) {
        fields.push({ name: "Errors", value: params.errors.join("\n").slice(0, 1000), inline: false });
    }

    const embed = {
        title: `Filmarks Feed Update: ${status}`,
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
    const errors: string[] = [];

    console.log("Scraping Filmarks pages...");

    // Scrape all 3 content types in parallel
    const [movies, dramas, animes] = await Promise.all([
        scrapeFilmarksPage(MOVIES_URL, "movie"),
        scrapeFilmarksPage(DRAMAS_URL, "drama"),
        scrapeFilmarksPage(ANIMES_URL, "anime"),
    ]);

    const allEntries = [...movies, ...dramas, ...animes];
    console.log(`Found ${allEntries.length} entries (${movies.length} movies, ${dramas.length} dramas, ${animes.length} animes)`);

    if (allEntries.length === 0) {
        console.log("No entries found, exiting");
        await sendDiscordNotification({ newPosts: 0, totalPosts: 0, errors: ["No entries scraped from Filmarks"] });
        return;
    }

    // Fetch mark dates with cache
    const cache = loadCache();
    const updatedCache: FilmarksCache = { ...cache };
    const postsWithDates: FilmarksFeedEntry[] = [];
    const entriesToFetch: FilmarksEntry[] = [];

    for (const entry of allEntries) {
        const cached = cache[entry.url];
        if (cached && isCacheValid(cached.cachedAt)) {
            postsWithDates.push({
                id: entry.id,
                title: entry.title,
                url: entry.url,
                date: cached.date,
                platform: "filmarks",
                description: entry.contentType === "movie" ? "映画" : entry.contentType === "drama" ? "ドラマ" : "アニメ",
                thumbnail: entry.thumbnail,
                rating: entry.rating,
            });
        } else {
            entriesToFetch.push(entry);
        }
    }

    console.log(`Cache hits: ${postsWithDates.length}, to fetch: ${entriesToFetch.length}`);

    // Batch fetch mark dates for new entries
    for (let i = 0; i < entriesToFetch.length; i += BATCH_SIZE) {
        const batch = entriesToFetch.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
            batch.map(async (entry) => {
                const markDate = await fetchMarkDate(entry.url);
                const date = markDate || "1970-01-01T00:00:00.000Z";

                updatedCache[entry.url] = {
                    date,
                    title: entry.title,
                    cachedAt: new Date().toISOString(),
                };

                return {
                    id: entry.id,
                    title: entry.title,
                    url: entry.url,
                    date,
                    platform: "filmarks" as const,
                    description: entry.contentType === "movie" ? "映画" : entry.contentType === "drama" ? "ドラマ" : "アニメ",
                    thumbnail: entry.thumbnail,
                    rating: entry.rating,
                };
            })
        );

        for (const result of batchResults) {
            if (result.status === "fulfilled") {
                postsWithDates.push(result.value);
            } else {
                errors.push(`Fetch failed: ${result.reason}`);
            }
        }
    }

    saveFilmarksCache(updatedCache);

    // Merge with existing data (dedup by ID)
    const existing = loadExisting();
    const postMap = new Map<string, FilmarksFeedEntry>();
    for (const post of existing.posts) {
        postMap.set(post.id, post);
    }
    for (const post of postsWithDates) {
        postMap.set(post.id, post);
    }

    const merged = Array.from(postMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const newCount = merged.length - existing.posts.length;

    const output: FilmarksFeedFile = {
        lastUpdated: new Date().toISOString(),
        posts: merged,
    };

    fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2) + "\n");
    console.log(`Saved ${merged.length} posts to ${JSON_PATH}`);

    if (newCount > 0) {
        console.log(`Added ${newCount} new posts`);
    } else {
        console.log("No new posts");
    }

    await sendDiscordNotification({
        newPosts: Math.max(0, newCount),
        totalPosts: merged.length,
        errors,
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await sendDiscordNotification({
        newPosts: 0,
        totalPosts: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
