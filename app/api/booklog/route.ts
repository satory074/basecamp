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
const parser = new Parser<{ item: CustomItem }>({
    customFields: {
        item: ["dc:date", "dc:creator"],
    },
});

const BOOKLOG_RSS_URL = `https://booklog.jp/users/${config.profiles.booklog.username}/feed`;

// HTMLからサムネイル画像URLを抽出する関数
function extractThumbnailFromDescription(description?: string): string | undefined {
    if (!description) return undefined;
    // Booklog RSSのdescriptionには <img src="..."> が含まれる
    const imgMatch = description.match(/<img.*?src="(.*?)".*?>/i);
    return imgMatch ? imgMatch[1] : undefined;
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

        const posts: Post[] = feed.items.map((item) => {
            const thumbnail = extractThumbnailFromDescription(item.description);

            return {
                id: item.link || `booklog-${item.title}`,
                title: item.title || "",
                url: item.link || "",
                date: item["dc:date"] || new Date().toISOString(),
                platform: "booklog" as const,
                description: item["dc:creator"] ? `著者: ${item["dc:creator"]}` : "",
                thumbnail: thumbnail,
            };
        });

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
