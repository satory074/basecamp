/**
 * Booklog フィード更新スクリプト
 *
 * Booklog RSS からブックリストを取得し、各書籍ページをスクレイピングして
 * ステータス・評価・読了日・タグ・カテゴリを取得する。
 * public/data/booklog-feed.json に差分マージする。
 *
 * GitHub Actions から定期実行される想定。
 *
 * 必要な環境変数:
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import * as fs from "fs";
import * as path from "path";
import Parser from "rss-parser";
import * as cheerio from "cheerio";

const JSON_PATH = path.join(process.cwd(), "public/data/booklog-feed.json");
const CACHE_PATH = path.join(process.cwd(), "public/data/booklog-cache.json");

const BOOKLOG_USERNAME = "satory074";
const BOOKLOG_RSS_URL = `https://booklog.jp/users/${BOOKLOG_USERNAME}/feed`;

const FETCH_TIMEOUT = 15000;
const BATCH_SIZE = 5;
const MAX_RETRIES = 3;
const MAX_PAGES = 50;
const BOOKLOG_SHELF_URL = `https://booklog.jp/users/${BOOKLOG_USERNAME}?category_id=all&status=all&display=blog`;

// ---- Types ----

interface BooklogCacheEntry {
    status: string;
    rating?: number;
    finishedDate?: string;
    tags?: string[];
    category?: string;
    cachedAt: string;
}

type BooklogCache = Record<string, BooklogCacheEntry>;

interface BooklogFeedEntry {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: "booklog";
    description: string;
    thumbnail?: string;
    rating?: number;
    finishedDate?: string;
    tags?: string[];
    category?: string;
}

interface BooklogFeedFile {
    lastUpdated: string;
    posts: BooklogFeedEntry[];
}

interface CustomItem {
    title?: string;
    link?: string;
    "dc:date"?: string;
    "dc:creator"?: string;
    description?: string;
}

// ---- Helpers ----

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "ja,en;q=0.9",
                    ...options.headers,
                },
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

/**
 * /item/1/ISBN 形式のURLを /users/{username}/archives/1/ISBN 形式に変換する。
 * 棚ページから取得されるURLは /item/1/ 形式だが、評価やステータスの
 * CSSセレクタは /users/.../archives/ ページでのみ動作するため変換が必要。
 */
function toArchivesUrl(url: string): string {
    const match = url.match(/booklog\.jp\/item\/(\d+\/\d+)/);
    if (match) {
        return `https://booklog.jp/users/${BOOKLOG_USERNAME}/archives/${match[1]}`;
    }
    return url;
}

/**
 * キャッシュエントリが有効な詳細データを持っているか判定する。
 * /item/1/ URLで取得された壊れたキャッシュ（status空・rating無し）を検出する。
 */
function hasCachedDetails(entry: BooklogCacheEntry): boolean {
    return !!(entry.status || entry.rating !== undefined);
}

function extractThumbnailFromDescription(description?: string): string | undefined {
    if (!description) return undefined;
    const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
    const imgUrl = imgMatch ? imgMatch[1] : undefined;
    return imgUrl ? imgUrl.replace(/^http:/, "https:") : undefined;
}

// ---- Book Details Scraping ----

interface BookDetails {
    status?: string;
    rating?: number;
    finishedDate?: string;
    tags?: string[];
    category?: string;
}

async function fetchBookDetails(bookUrl: string): Promise<BookDetails> {
    try {
        const response = await fetchWithRetry(bookUrl);
        const html = await response.text();
        const $ = cheerio.load(html);

        const status = $("span.status").first().text().trim() || undefined;
        const rateText = $("span.rate").first().text().trim();
        const rating = rateText ? parseInt(rateText, 10) : undefined;
        const finishedDateText = $(".date a").first().text().trim();
        const finishedDate = finishedDateText || undefined;

        const tags: string[] = [];
        $(".more-info-tags li a").each((_, el) => {
            const tag = $(el).text().trim();
            if (tag) tags.push(tag);
        });

        const categoryText = $(".more-info-category a").first().text().trim();
        const category = categoryText || undefined;

        return { status, rating, finishedDate, tags: tags.length > 0 ? tags : undefined, category };
    } catch (error) {
        console.warn(`Failed to fetch book details from ${bookUrl}:`, error instanceof Error ? error.message : error);
        return {};
    }
}

// ---- Shelf Scraping (pagination) ----

interface ShelfItem {
    title: string;
    url: string;
    thumbnail?: string;
    date?: string;
}

async function scrapeBooklogShelfPage(pageUrl: string): Promise<ShelfItem[]> {
    try {
        const response = await fetchWithRetry(pageUrl);
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: ShelfItem[] = [];

        $("div.item-wrapper.shelf-item").each((_, element) => {
            const $item = $(element);
            const $titleLink = $item.find("h2 a").first();
            const title = $titleLink.text().trim();
            const href = $titleLink.attr("href");

            if (!title || !href) return;

            const url = href.startsWith("http") ? href : `https://booklog.jp${href}`;

            const $img = $item.find(".item-area-image img, .item-area-img img").first();
            let thumbnail = $img.attr("src") || undefined;
            if (thumbnail && thumbnail.startsWith("http:")) {
                thumbnail = thumbnail.replace(/^http:/, "https:");
            }

            const dateText = $item.find("p.date a").first().text().trim();
            let date: string | undefined;
            if (dateText) {
                const match = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
                if (match) {
                    date = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}T00:00:00+09:00`;
                }
            }

            items.push({ title, url, thumbnail, date });
        });

        return items;
    } catch (error) {
        console.warn(`Failed to scrape shelf page ${pageUrl}:`, error instanceof Error ? error.message : error);
        return [];
    }
}

async function scrapeAllBooklogPages(cache: BooklogCache): Promise<ShelfItem[]> {
    const allItems: ShelfItem[] = [];
    const seenUrls = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page++) {
        const url = `${BOOKLOG_SHELF_URL}&page=${page}`;
        console.log(`Scraping shelf page ${page}...`);

        const items = await scrapeBooklogShelfPage(url);

        if (items.length === 0) {
            console.log(`Page ${page}: no items, stopping`);
            break;
        }

        let newCount = 0;
        let cachedCount = 0;
        for (const item of items) {
            if (!seenUrls.has(item.url)) {
                seenUrls.add(item.url);
                allItems.push(item);
                newCount++;
                if (cache[item.url] && isCacheValid(cache[item.url].cachedAt) && hasCachedDetails(cache[item.url])) {
                    cachedCount++;
                }
            }
        }

        console.log(`Page ${page}: ${newCount} items (${cachedCount} cached)`);

        // If all items on this page are cached, stop (incremental optimization)
        if (newCount > 0 && cachedCount === newCount) {
            console.log(`Page ${page}: all items cached, stopping pagination`);
            break;
        }

        // Be polite to the server
        await delay(500);
    }

    return allItems;
}

// ---- Cache ----

function loadCache(): BooklogCache {
    try {
        return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    } catch {
        return {};
    }
}

function saveCache(cache: BooklogCache): void {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
}

function loadExisting(): BooklogFeedFile {
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
        fields.push({ name: "Warning", value: "0 posts fetched — RSS may be down", inline: false });
    }

    if (params.errors.length > 0) {
        fields.push({ name: "Errors", value: params.errors.join("\n").slice(0, 1000), inline: false });
    }

    const embed = {
        title: `Booklog Feed Update: ${status}`,
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

    console.log("Fetching Booklog RSS...");

    const parser = new Parser<{ item: CustomItem }>({
        customFields: {
            item: ["dc:date", "dc:creator", "description"],
        },
    });

    const feed = await parser.parseURL(BOOKLOG_RSS_URL);
    console.log(`Found ${feed.items.length} items in RSS`);

    const cache = loadCache();
    const updatedCache: BooklogCache = { ...cache };
    const posts: BooklogFeedEntry[] = [];

    // Build RSS date lookup (RSS has the most accurate timestamps)
    const rssDateMap = new Map<string, string>();
    for (const item of feed.items) {
        if (item.link && item["dc:date"]) {
            rssDateMap.set(item.link, item["dc:date"]);
        }
    }

    // Scrape all shelf pages with pagination
    console.log("Scraping bookshelf pages...");
    const shelfItems = await scrapeAllBooklogPages(cache);
    console.log(`Found ${shelfItems.length} total books from shelf`);

    // Also include any RSS-only items not found in shelf
    const shelfUrls = new Set(shelfItems.map(i => i.url));
    for (const item of feed.items) {
        if (item.link && !shelfUrls.has(item.link)) {
            const thumbnail = extractThumbnailFromDescription(item.description);
            shelfItems.push({
                title: item.title || "",
                url: item.link,
                thumbnail,
                date: item["dc:date"],
            });
        }
    }

    // Classify cache hits / misses
    const itemsToFetch: ShelfItem[] = [];
    for (const item of shelfItems) {
        const cached = item.url ? cache[item.url] : undefined;

        if (cached && isCacheValid(cached.cachedAt) && hasCachedDetails(cached)) {
            posts.push({
                id: item.url || `booklog-${item.title}`,
                title: item.title,
                url: item.url,
                date: rssDateMap.get(item.url) || item.date || new Date().toISOString(),
                platform: "booklog",
                description: cached.status,
                thumbnail: item.thumbnail,
                rating: cached.rating,
                finishedDate: cached.finishedDate,
                tags: cached.tags,
                category: cached.category,
            });
        } else {
            itemsToFetch.push(item);
        }
    }

    console.log(`Cache hits: ${posts.length}, to fetch: ${itemsToFetch.length}`);

    // Batch fetch book details for new entries
    for (let i = 0; i < itemsToFetch.length; i += BATCH_SIZE) {
        const batch = itemsToFetch.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
            batch.map(async (item) => {
                const details = item.url ? await fetchBookDetails(toArchivesUrl(item.url)) : {};

                if (item.url) {
                    updatedCache[item.url] = {
                        status: details.status || "",
                        rating: details.rating,
                        finishedDate: details.finishedDate,
                        tags: details.tags,
                        category: details.category,
                        cachedAt: new Date().toISOString(),
                    };
                }

                return {
                    id: item.url || `booklog-${item.title}`,
                    title: item.title,
                    url: item.url,
                    date: rssDateMap.get(item.url) || item.date || new Date().toISOString(),
                    platform: "booklog" as const,
                    description: details.status || "",
                    thumbnail: item.thumbnail,
                    rating: details.rating,
                    finishedDate: details.finishedDate,
                    tags: details.tags,
                    category: details.category,
                };
            })
        );

        for (const result of batchResults) {
            if (result.status === "fulfilled") {
                posts.push(result.value);
            } else {
                errors.push(`Fetch failed: ${result.reason}`);
            }
        }
    }

    // Save updated cache
    saveCache(updatedCache);

    // Merge with existing data (dedup by ID)
    const existing = loadExisting();
    const postMap = new Map<string, BooklogFeedEntry>();
    for (const post of existing.posts) {
        postMap.set(post.id, post);
    }
    for (const post of posts) {
        postMap.set(post.id, post);
    }

    const merged = Array.from(postMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const newCount = merged.length - existing.posts.length;

    const output: BooklogFeedFile = {
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
