import { NextResponse, NextRequest } from "next/server";
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import {
    loadCache,
    saveCache,
    isCacheValid,
    type BooklogCache,
} from "../../lib/cache-utils";

export const revalidate = 3600; // ISR: 6時間ごとに再検証（高速化）

const BOOKLOG_CACHE_FILE = "booklog-cache.json";

// Booklog RSSのカスタムフィールド
interface CustomItem {
    title?: string;
    link?: string;
    "dc:date"?: string;
    "dc:creator"?: string;
    description?: string;
}

// parserにカスタムフィールドを認識させる
// Booklog RSSはRDF形式のため、descriptionも明示的に指定
const parser = new Parser<{ item: CustomItem }>({
    customFields: {
        item: ["dc:date", "dc:creator", "description"],
    },
});

const BOOKLOG_RSS_URL = `https://booklog.jp/users/${config.profiles.booklog.username}/feed`;

// タイムアウトと並列度制限
const FETCH_TIMEOUT = 5000; // 5秒
const BATCH_SIZE = 5; // 同時フェッチ数

// HTMLからサムネイル画像URLを抽出する関数（HTTP→HTTPS変換付き）
function extractThumbnailFromDescription(description?: string): string | undefined {
    if (!description) return undefined;
    // Booklog RSSのdescriptionには <img src="..."> が含まれる（CDATA形式）
    // より堅牢な正規表現: src属性の前に他の属性がある場合にも対応
    const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
    const imgUrl = imgMatch ? imgMatch[1] : undefined;
    // HTTP画像をHTTPSに変換（mixed content警告を回避）
    return imgUrl ? imgUrl.replace(/^http:/, "https:") : undefined;
}

interface BookDetails {
    status?: string;
    rating?: number;
    finishedDate?: string;
    tags?: string[];
    category?: string;
}

// 書籍ページから詳細情報を取得する関数（タイムアウト付き）
async function fetchBookDetails(bookUrl: string): Promise<BookDetails> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
        const response = await fetch(bookUrl, {
            signal: controller.signal,
            next: { revalidate: 3600 },
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        // ステータス
        const status = $("span.status").first().text().trim() || undefined;

        // 星評価（filled starsをカウント）
        const ratingCount = $(".rank-icon .fa-star").length;
        const rating = ratingCount > 0 ? ratingCount : undefined;

        // 読了日
        const finishedDateText = $(".date a").first().text().trim();
        const finishedDate = finishedDateText || undefined;

        // タグ
        const tags: string[] = [];
        $(".more-info-tags li a").each((_, el) => {
            const tag = $(el).text().trim();
            if (tag) tags.push(tag);
        });

        // 本棚カテゴリ
        const categoryText = $(".more-info-category a").first().text().trim();
        const category = categoryText || undefined;

        return {
            status,
            rating,
            finishedDate,
            tags: tags.length > 0 ? tags : undefined,
            category,
        };
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn(`Timeout fetching book details from ${bookUrl}`);
        }
        return {};
    } finally {
        clearTimeout(timeout);
    }
}

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 }); // 60 requests per hour

export async function GET(request: NextRequest) {
    // Apply rate limiting
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
        const feed = await parser.parseURL(BOOKLOG_RSS_URL);

        // キャッシュ読み込み
        const cache = await loadCache<BooklogCache>(BOOKLOG_CACHE_FILE);
        const newCacheEntries: BooklogCache = {};

        // キャッシュを活用して各書籍のステータスを取得（大幅高速化）
        const posts: Post[] = [];
        const itemsToFetch: { item: (typeof feed.items)[0]; index: number }[] =
            [];

        // キャッシュヒット/ミスを分類
        for (let i = 0; i < feed.items.length; i++) {
            const item = feed.items[i];
            const cached = item.link ? cache[item.link] : undefined;

            if (cached && isCacheValid(cached.cachedAt)) {
                // キャッシュヒット
                const thumbnail = extractThumbnailFromDescription(
                    item.description
                );
                posts.push({
                    id: item.link || `booklog-${item.title}`,
                    title: item.title || "",
                    url: item.link || "",
                    date: item["dc:date"] || new Date().toISOString(),
                    platform: "booklog" as const,
                    description: cached.status,
                    thumbnail: thumbnail,
                    rating: cached.rating,
                    finishedDate: cached.finishedDate,
                    tags: cached.tags,
                    category: cached.category,
                });
            } else {
                // キャッシュミス - 後でfetch
                itemsToFetch.push({ item, index: i });
            }
        }

        // 新規エントリのみバッチ処理でfetch
        if (itemsToFetch.length > 0) {
            console.log(
                `Booklog: ${feed.items.length - itemsToFetch.length} cache hits, ${itemsToFetch.length} new entries to fetch`
            );

            for (let i = 0; i < itemsToFetch.length; i += BATCH_SIZE) {
                const batch = itemsToFetch.slice(i, i + BATCH_SIZE);
                const batchResults = await Promise.allSettled(
                    batch.map(async ({ item }) => {
                        const thumbnail = extractThumbnailFromDescription(
                            item.description
                        );
                        const details = item.link
                            ? await fetchBookDetails(item.link)
                            : {};

                        // 新しいキャッシュエントリを作成
                        if (item.link) {
                            newCacheEntries[item.link] = {
                                status: details.status || "",
                                rating: details.rating,
                                finishedDate: details.finishedDate,
                                tags: details.tags,
                                category: details.category,
                                cachedAt: new Date().toISOString(),
                            };
                        }

                        return {
                            id: item.link || `booklog-${item.title}`,
                            title: item.title || "",
                            url: item.link || "",
                            date: item["dc:date"] || new Date().toISOString(),
                            platform: "booklog" as const,
                            description: details.status || "",
                            thumbnail: thumbnail,
                            rating: details.rating,
                            finishedDate: details.finishedDate,
                            tags: details.tags,
                            category: details.category,
                        };
                    })
                );
                // 成功したリクエストのみ追加（一部失敗しても他のデータは表示）
                for (const result of batchResults) {
                    if (result.status === 'fulfilled') {
                        posts.push(result.value);
                    }
                }
            }

            // 新規エントリをキャッシュに保存
            if (Object.keys(newCacheEntries).length > 0) {
                await saveCache(BOOKLOG_CACHE_FILE, newCacheEntries);
            }
        } else {
            console.log(`Booklog: All ${feed.items.length} entries from cache`);
        }

        // 日付順でソート（RSSの順序が保証されないため）
        posts.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=21600");
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        console.error("Booklog API error:", error);
        // Return empty array instead of error object to prevent map() errors
        const jsonResponse = NextResponse.json([]);
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    }
}
