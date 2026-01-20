import { NextResponse, NextRequest } from "next/server";
import Parser from "rss-parser";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { ApiError } from "../../lib/api-errors";
import { extractThumbnailFromContent } from "@/app/lib/shared/html-utils";

export const revalidate = 21600; // ISR: 6時間ごとに再生成

// カスタム型を拡張
interface CustomItem {
    title?: string;
    link?: string;
    pubDate?: string;
    guid?: string;
    content?: string;
    contentSnippet?: string;
    "content:encoded"?: string;
}

// parserにカスタムフィールドを認識させる
const parser = new Parser<{ item: CustomItem }>({
    customFields: {
        item: ["content:encoded"],
    },
});

// RSSHub経由でXのツイートを取得
const RSS_URL = `https://rsshub.app/twitter/user/${config.profiles.x.username}`;

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

export async function GET(request: NextRequest) {
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
        const feed = await parser.parseURL(RSS_URL).catch(() => {
            throw new ApiError("Failed to parse X RSS feed", 502, "RSS_PARSE_ERROR");
        });

        const posts: Post[] = feed.items.map((item) => {
            // サムネイル取得: content:encodedから抽出
            const thumbnail = extractThumbnailFromContent(item["content:encoded"] || item.content);

            // ツイートテキストを短縮（タイトル用）
            const fullText = item.title || "";
            const title = fullText.length > 100 ? fullText.substring(0, 100) + "..." : fullText;

            return {
                id: item.guid || item.link || "",
                title,
                url: item.link || "",
                date: item.pubDate || new Date().toISOString(),
                platform: "x",
                description: fullText,
                thumbnail,
            };
        });

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        console.error("X RSS error:", error);
        // エラー時は空配列を返す
        const jsonResponse = NextResponse.json([]);
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    }
}
