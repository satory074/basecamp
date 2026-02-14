import { NextResponse, NextRequest } from "next/server";
import Parser from "rss-parser";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { ApiError, createErrorResponse } from "../../lib/api-errors";
import { extractThumbnailFromContent } from "@/app/lib/shared/html-utils";
import { fetchWithTimeout } from "../../lib/fetch-with-timeout";

export const revalidate = 21600; // ISR: 6時間ごとに再生成（高速化）

interface CustomItem {
    title?: string;
    link?: string;
    pubDate?: string;
    guid?: string;
    content?: string;
    contentSnippet?: string;
    "content:encoded"?: string;
    "hatena:imageurl"?: string;
}

interface FeedResult {
    items: CustomItem[];
}

const parser = new Parser({
    customFields: {
        item: ["hatena:imageurl", "content:encoded"],
    },
});

const HATENA_RSS_URL = `https://${config.profiles.hatena.username}.hatenablog.com/rss`;

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
        const response = await fetchWithTimeout(HATENA_RSS_URL, {
            next: { revalidate: 3600 },
            timeoutMs: 10000,
        });

        if (!response.ok) {
            throw new ApiError(`Failed to fetch Hatena RSS: ${response.status}`, 502, "HATENA_FETCH_ERROR");
        }

        const xml = await response.text();
        const feed = await new Promise<FeedResult>((resolve, reject) => {
            parser.parseString(xml, (err, parsedFeed) => {
                if (err) {
                    reject(new ApiError("Failed to parse Hatena RSS feed", 502, "RSS_PARSE_ERROR"));
                    return;
                }
                resolve(parsedFeed as FeedResult);
            });
        });

        const posts: Post[] = feed.items.map((item) => {
            const thumbnail =
                item["hatena:imageurl"] || extractThumbnailFromContent(item["content:encoded"] || item.content);

            const description = item.contentSnippet
                ? item.contentSnippet.substring(0, 200) + (item.contentSnippet.length > 200 ? "..." : "")
                : "";

            return {
                id: item.guid || item.link || "",
                title: item.title || "",
                url: item.link || "",
                date: item.pubDate || new Date().toISOString(),
                platform: "hatena",
                description,
                thumbnail,
                data: {
                    description,
                    thumbnail,
                },
            };
        });

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        const errorResponse = createErrorResponse(error, "Failed to fetch Hatena posts");
        errorResponse.headers.set("X-RateLimit-Limit", "60");
        errorResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return errorResponse;
    }
}
