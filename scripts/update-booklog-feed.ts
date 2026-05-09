/**
 * Booklog フィード更新スクリプト
 *
 * Booklog の本棚 (display=image) から全書籍を取得する。各書籍 div には
 * data-book 属性に書誌情報・ステータス・評価・読了日・カテゴリ・タグが
 * JSON で埋め込まれているので、個別の書籍ページをスクレイピングする
 * 必要はない。RSS は正確なタイムスタンプ取得用。
 *
 * GitHub Actions から定期実行される想定。
 *
 * 必要な環境変数:
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import Parser from "rss-parser";
import * as cheerio from "cheerio";

import { notifyIfNoteworthy } from "./lib/discord-notification";
import { readFeed, writeFeed } from "./lib/feed-storage";

const FEED_FILE = "booklog-feed.json";

const BOOKLOG_USERNAME = "satory074";
const BOOKLOG_RSS_URL = `https://booklog.jp/users/${BOOKLOG_USERNAME}/feed`;

const FETCH_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const MAX_PAGES = 50;
const BOOKLOG_SHELF_URL = `https://booklog.jp/users/${BOOKLOG_USERNAME}?category_id=all&status=all&display=image`;

// ---- Types ----

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

interface ShelfItem {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    status: string;
    rating?: number;
    finishedDate?: string;
    category?: string;
    tags?: string[];
    shelfAddedAt?: string;
}

interface DataBook {
    id?: string;
    service_id?: string;
    title?: string;
    image?: string;
    status_name?: string;
    rank?: string;
    read_at?: string | null;
    create_on?: string;
    category_name?: string | false;
    tags?: string[];
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
 * URLから書籍ID部分を抽出する。
 * /item/1/ID と /users/.../archives/1/ID の両方に対応。
 * IDはISBN-13/ISBN-10(末尾X)/ASIN(B始まり)が混在。重複判定に使用する。
 */
function extractIsbn(url: string): string | undefined {
    const match = url.match(/(?:item|archives)\/\d+\/([\dA-Z]+)$/i);
    return match ? match[1] : undefined;
}

function extractThumbnailFromDescription(description?: string): string | undefined {
    if (!description) return undefined;
    const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
    const imgUrl = imgMatch ? imgMatch[1] : undefined;
    return imgUrl ? imgUrl.replace(/^http:/, "https:") : undefined;
}

/**
 * Booklog の `read_at` ("2026-04-06 00:00:00") を表示用の和暦
 * "2026年4月6日" に変換する。先頭のゼロは落とす。
 */
function formatReadAt(readAt: string | null | undefined): string | undefined {
    if (!readAt) return undefined;
    const match = readAt.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!match) return undefined;
    return `${match[1]}年${parseInt(match[2], 10)}月${parseInt(match[3], 10)}日`;
}

/**
 * `read_at` または `create_on` を ISO 8601 (+09:00) に変換する。
 * フィード上の日付ソート用。Booklog は JST で値を返す前提。
 */
function toIsoJst(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    const match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/);
    if (!match) return undefined;
    const [, y, m, d, hh, mm, ss] = match;
    const pad = (s: string) => s.padStart(2, "0");
    return `${y}-${pad(m)}-${pad(d)}T${pad(hh ?? "0")}:${pad(mm ?? "0")}:${pad(ss ?? "0")}+09:00`;
}

// ---- Shelf Scraping ----

function parseDataBook(raw: string | undefined): DataBook | undefined {
    if (!raw) return undefined;
    try {
        return JSON.parse(raw) as DataBook;
    } catch {
        return undefined;
    }
}

async function scrapeBooklogShelfPage(pageUrl: string): Promise<ShelfItem[]> {
    try {
        const response = await fetchWithRetry(pageUrl);
        const html = await response.text();
        const $ = cheerio.load(html);
        const items: ShelfItem[] = [];

        $("div.item-wrapper.shelf-item").each((_, element) => {
            const data = parseDataBook($(element).attr("data-book"));
            if (!data || !data.id || !data.title) return;

            const serviceId = data.service_id || "1";
            const url = `https://booklog.jp/item/${serviceId}/${data.id}`;
            const thumbnail = data.image ? data.image.replace(/^http:/, "https:") : undefined;
            const rank = data.rank ? parseInt(data.rank, 10) : 0;
            const rating = rank > 0 ? rank : undefined;
            const category = typeof data.category_name === "string" && data.category_name && data.category_name !== "未設定"
                ? data.category_name
                : undefined;
            const tags = data.tags && data.tags.length > 0 ? data.tags : undefined;

            items.push({
                id: data.id,
                title: data.title,
                url,
                thumbnail,
                status: data.status_name || "",
                rating,
                finishedDate: formatReadAt(data.read_at),
                category,
                tags,
                shelfAddedAt: toIsoJst(data.read_at) || toIsoJst(data.create_on),
            });
        });

        return items;
    } catch (error) {
        console.warn(`Failed to scrape shelf page ${pageUrl}:`, error instanceof Error ? error.message : error);
        return [];
    }
}

async function scrapeAllBooklogPages(): Promise<ShelfItem[]> {
    const allItems: ShelfItem[] = [];
    const seenIds = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page++) {
        const url = `${BOOKLOG_SHELF_URL}&page=${page}`;
        console.log(`Scraping shelf page ${page}...`);

        const items = await scrapeBooklogShelfPage(url);

        if (items.length === 0) {
            console.log(`Page ${page}: no items, stopping`);
            break;
        }

        let newCount = 0;
        for (const item of items) {
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                allItems.push(item);
                newCount++;
            }
        }

        console.log(`Page ${page}: ${newCount} items`);

        await delay(500);
    }

    return allItems;
}

async function loadExisting(): Promise<BooklogFeedFile> {
    return readFeed<BooklogFeedFile>(FEED_FILE, { lastUpdated: "", posts: [] });
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

    // Build RSS date lookup keyed by ISBN (RSS gives the most accurate review timestamps)
    const rssDateMap = new Map<string, string>();
    const rssDescMap = new Map<string, string | undefined>();
    for (const item of feed.items) {
        if (!item.link) continue;
        const isbn = extractIsbn(item.link);
        if (!isbn) continue;
        if (item["dc:date"]) rssDateMap.set(isbn, item["dc:date"]);
        rssDescMap.set(isbn, item.description);
    }

    // Scrape all shelf pages with pagination (display=image embeds full data-book JSON)
    console.log("Scraping bookshelf pages...");
    const shelfItems = await scrapeAllBooklogPages();
    console.log(`Found ${shelfItems.length} total books from shelf`);

    const posts: BooklogFeedEntry[] = shelfItems.map((item) => {
        const rssDate = rssDateMap.get(item.id);
        const date = rssDate || item.shelfAddedAt || new Date().toISOString();
        const thumbnail = item.thumbnail || extractThumbnailFromDescription(rssDescMap.get(item.id));
        return {
            id: item.url,
            title: item.title,
            url: item.url,
            date,
            platform: "booklog" as const,
            description: item.status,
            thumbnail,
            rating: item.rating,
            finishedDate: item.finishedDate,
            tags: item.tags,
            category: item.category,
        };
    });

    // Merge with existing data (dedup by ISBN to keep entries that may have been
    // dropped from the shelf — extremely rare but cheap to support).
    const existing = await loadExisting();
    const postMap = new Map<string, BooklogFeedEntry>();
    for (const post of existing.posts) {
        const key = extractIsbn(post.id) || post.id;
        postMap.set(key, post);
    }
    for (const post of posts) {
        const key = extractIsbn(post.id) || post.id;
        postMap.set(key, post);
    }

    const merged = Array.from(postMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const newCount = merged.length - existing.posts.length;

    const output: BooklogFeedFile = {
        lastUpdated: new Date().toISOString(),
        posts: merged,
    };

    await writeFeed(FEED_FILE, output);
    console.log(`Saved ${merged.length} posts to ${FEED_FILE}`);

    if (newCount > 0) {
        console.log(`Added ${newCount} new posts`);
    } else {
        console.log("No new posts");
    }

    const newPosts = Math.max(0, newCount);
    const zeroFetchWarning = merged.length === 0 && errors.length === 0;
    await notifyIfNoteworthy({
        source: "Booklog",
        status: zeroFetchWarning ? "warning" : "success",
        newItems: newPosts,
        metrics: [
            { name: "New Posts", value: `+${newPosts}` },
            { name: "Total Posts", value: merged.length },
        ],
        errors: zeroFetchWarning ? ["0 posts fetched — RSS may be down"] : errors,
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await notifyIfNoteworthy({
        source: "Booklog",
        status: "error",
        newItems: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
