/**
 * Booklog フィード更新スクリプト
 *
 * Booklog の本棚 (display=image) から全書籍を取得する。各書籍 div には
 * data-book 属性に書誌情報・ステータス・評価・読了日・カテゴリ・タグが
 * JSON で埋め込まれているので、個別の書籍ページをスクレイピングする
 * 必要はない。RSS は正確なタイムスタンプ取得用 (取れなくても続ける)。
 *
 * 実行場所: GCP Cloud Run ジョブ `booklog-feed` (asia-northeast1、1 日 1 回)。
 * GitHub Actions からはブクログの bot チェック (HTTP 202) で本棚が読めない
 * (2026-09-29〜)。デプロイは `jobs/booklog/deploy.sh`。
 *
 * 環境変数:
 *   GCS_BUCKET          - 書き込み先 (未設定なら public/data/)
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import Parser from "rss-parser";

import { notifyIfNoteworthy } from "./lib/discord-notification";
import { readFeed, writeFeed } from "./lib/feed-storage";
import { decideWrite, isBotChallenge, parseShelfHtml, type ShelfItem } from "./lib/booklog/shelf";

const FEED_FILE = "booklog-feed.json";

const BOOKLOG_USERNAME = "satory074";
const BOOKLOG_RSS_URL = `https://booklog.jp/users/${BOOKLOG_USERNAME}/feed`;

const FETCH_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const MAX_PAGES = 50;
/** ページ間の待ち時間。1 日 1 回・27 ページ程度なので急がない */
const PAGE_DELAY_MS = 2000;
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

// ---- Helpers ----

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        try {
            return await fetch(url, {
                signal: controller.signal,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "ja,en;q=0.9",
                },
            });
        } catch (error) {
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

/** 0 冊だったページの応答を 1 行にまとめる (何が返ったかをログと Discord に残す) */
function describeResponse(response: Response, html: string): string {
    const title = html.match(/<title>([^<]*)/i)?.[1]?.trim() || "-";
    const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200);
    const h = (name: string) => response.headers.get(name) ?? "-";
    return `HTTP ${response.status} / pop ${h("x-amz-cf-pop")} / x-cache ${h("x-cache")} / title "${title}" / ${html.length} bytes / "${text}"`;
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

// ---- Shelf Scraping ----

interface ShelfResult {
    items: ShelfItem[];
    /** 1 冊も取れなかったページの応答 (最初の 1 つ) */
    emptyPage?: string;
}

async function scrapeAllBooklogPages(): Promise<ShelfResult> {
    const items: ShelfItem[] = [];
    const seenIds = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page++) {
        const url = `${BOOKLOG_SHELF_URL}&page=${page}`;
        console.log(`Scraping shelf page ${page}...`);

        const response = await fetchWithRetry(url);
        const html = await response.text();

        if (isBotChallenge(response.status, html)) {
            // bot チェックはページを進めても変わらない。ここで止める
            const detail = describeResponse(response, html);
            console.warn(`Page ${page}: bot challenge — ${detail}`);
            return { items, emptyPage: `page ${page} (bot チェック): ${detail}` };
        }

        const pageItems = response.ok ? parseShelfHtml(html) : [];
        if (pageItems.length === 0) {
            // 最終ページの次は正常 (200) でも 0 冊になる。1 ページ目か 200 以外なら異常
            const detail = describeResponse(response, html);
            console.log(`Page ${page}: no items, stopping — ${detail}`);
            return { items, emptyPage: page === 1 || !response.ok ? `page ${page}: ${detail}` : undefined };
        }

        let newCount = 0;
        for (const item of pageItems) {
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                items.push(item);
                newCount++;
            }
        }
        console.log(`Page ${page}: ${newCount} items`);

        await delay(PAGE_DELAY_MS);
    }

    return { items };
}

async function loadExisting(): Promise<BooklogFeedFile> {
    return readFeed<BooklogFeedFile>(FEED_FILE, { lastUpdated: "", posts: [] });
}

/** RSS は日時の補助。取れなくても本棚の create_on / read_at で代わりになるので続ける */
async function fetchRssDates(errors: string[]) {
    const rssDateMap = new Map<string, string>();
    const rssDescMap = new Map<string, string | undefined>();
    try {
        const parser = new Parser<{ item: CustomItem }>({
            customFields: { item: ["dc:date", "dc:creator", "description"] },
        });
        const feed = await parser.parseURL(BOOKLOG_RSS_URL);
        console.log(`Found ${feed.items.length} items in RSS`);
        for (const item of feed.items) {
            if (!item.link) continue;
            const isbn = extractIsbn(item.link);
            if (!isbn) continue;
            if (item["dc:date"]) rssDateMap.set(isbn, item["dc:date"]);
            rssDescMap.set(isbn, item.description);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`RSS fetch failed: ${message}`);
        errors.push(`RSS が読めなかった (本棚の日時で代用): ${message}`);
    }
    return { rssDateMap, rssDescMap };
}

// ---- Main ----

async function main() {
    const errors: string[] = [];

    console.log("Fetching Booklog RSS...");
    const { rssDateMap, rssDescMap } = await fetchRssDates(errors);

    console.log("Scraping bookshelf pages...");
    const shelf = await scrapeAllBooklogPages();
    console.log(`Found ${shelf.items.length} total books from shelf`);

    const existing = await loadExisting();
    const decision = decideWrite(shelf.items.length, existing.posts.length);
    if (!decision.write) {
        // 書き込まない = lastUpdated を進めない → Daily Digest の stale 検知に出る
        throw new Error(`${decision.reason}。既存の ${existing.posts.length} 冊はそのまま。${shelf.emptyPage ?? ""}`);
    }
    if (decision.warning) {
        errors.push(shelf.emptyPage ? `${decision.warning} — ${shelf.emptyPage}` : decision.warning);
    }

    const posts: BooklogFeedEntry[] = shelf.items.map((item) => {
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
    const postMap = new Map<string, BooklogFeedEntry>();
    for (const post of existing.posts) {
        postMap.set(extractIsbn(post.id) || post.id, post);
    }
    for (const post of posts) {
        postMap.set(extractIsbn(post.id) || post.id, post);
    }

    const merged = Array.from(postMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const newCount = Math.max(0, merged.length - existing.posts.length);

    const output: BooklogFeedFile = {
        lastUpdated: new Date().toISOString(),
        posts: merged,
    };

    await writeFeed(FEED_FILE, output);
    console.log(`Saved ${merged.length} posts to ${FEED_FILE} (${newCount > 0 ? `+${newCount} new` : "no new posts"})`);

    await notifyIfNoteworthy({
        source: "Booklog",
        status: errors.length > 0 ? "warning" : decision.status,
        newItems: newCount,
        metrics: [
            { name: "New Posts", value: `+${newCount}` },
            { name: "Shelf Books", value: shelf.items.length },
            { name: "Total Posts", value: merged.length },
        ],
        errors,
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
