import { NextResponse, NextRequest } from "next/server";
import Parser from "rss-parser";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";

export const revalidate = 3600; // ISR: 1時間ごとに再検証

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

// HTMLからサムネイル画像URLを抽出する関数
function extractThumbnailFromDescription(description?: string): string | undefined {
    if (!description) return undefined;
    // Booklog RSSのdescriptionには <img src="..."> が含まれる（CDATA形式）
    // より堅牢な正規表現: src属性の前に他の属性がある場合にも対応
    const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
    return imgMatch ? imgMatch[1] : undefined;
}

// 書籍ページから読書ステータスを取得する関数（タイムアウト付き）
async function fetchBookStatus(bookUrl: string): Promise<string | undefined> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
        const response = await fetch(bookUrl, {
            signal: controller.signal,
            next: { revalidate: 3600 },
        });
        const html = await response.text();
        // <span class="status">読みたい</span> を抽出
        const match = html.match(/<span class="status">([^<]+)<\/span>/);
        return match ? match[1] : undefined;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn(`Timeout fetching book status from ${bookUrl}`);
        }
        return undefined;
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

        // 各書籍のステータスをバッチ処理で取得（並列度制限付き）
        const posts: Post[] = [];
        for (let i = 0; i < feed.items.length; i += BATCH_SIZE) {
            const batch = feed.items.slice(i, i + BATCH_SIZE);
            const batchPosts = await Promise.all(
                batch.map(async (item) => {
                    const thumbnail = extractThumbnailFromDescription(item.description);
                    const status = item.link ? await fetchBookStatus(item.link) : undefined;

                    return {
                        id: item.link || `booklog-${item.title}`,
                        title: item.title || "",
                        url: item.link || "",
                        date: item["dc:date"] || new Date().toISOString(),
                        platform: "booklog" as const,
                        description: status || "",
                        thumbnail: thumbnail,
                    };
                })
            );
            posts.push(...batchPosts);
        }

        const jsonResponse = NextResponse.json(posts);
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
