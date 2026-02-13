import { NextResponse, NextRequest } from "next/server";
import Parser from "rss-parser";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { ApiError, createErrorResponse } from "../../lib/api-errors";
import { stripHtmlTags, extractThumbnailFromContent } from "@/app/lib/shared/html-utils";
import { fetchWithTimeout } from "../../lib/fetch-with-timeout";

export const revalidate = 21600;

type CustomItem = {
    guid?: string;
    title?: string;
    link?: string;
    pubDate?: string;
    description?: string;
    content?: string;
    "content:encoded"?: string;
    enclosure?: {
        url?: string;
    };
    "media:thumbnail"?: {
        $?: { url?: string };
    } | string;
    "[object Object]"?: string;
};

type FeedResult = {
    items: CustomItem[];
};

const parser = new Parser({
    customFields: {
        item: ["content:encoded", ["enclosure", { keepArray: false }], ["media:thumbnail", { keepArray: false }]],
    },
});

const NOTE_RSS_URL = `https://note.com/${config.profiles.note.username}/rss`;

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
        const response = await fetchWithTimeout(NOTE_RSS_URL, {
            next: { revalidate: 3600 },
            timeoutMs: 10000,
        });

        if (!response.ok) {
            throw new ApiError(`Failed to fetch Note RSS: ${response.status}`, 502, "NOTE_FETCH_ERROR");
        }

        const xml = await response.text();
        const result = await new Promise<FeedResult>((resolve, reject) => {
            parser.parseString(xml, (err, feed) => {
                if (err) {
                    reject(new ApiError("Failed to parse Note RSS feed", 502, "RSS_PARSE_ERROR"));
                    return;
                }
                resolve(feed as FeedResult);
            });
        });

        const posts: Post[] = result.items.map((item) => {
            let thumbnail: string | undefined;

            if (item["[object Object]"] && typeof item["[object Object]"] === "string") {
                thumbnail = item["[object Object]"];
            } else if (item["media:thumbnail"]) {
                const mediaThumbnail = item["media:thumbnail"];
                if (typeof mediaThumbnail === "string") {
                    thumbnail = mediaThumbnail;
                } else if (mediaThumbnail.$?.url) {
                    thumbnail = mediaThumbnail.$.url;
                }
            }

            if (!thumbnail && item.enclosure?.url) {
                thumbnail = item.enclosure.url;
            }

            if (!thumbnail) {
                thumbnail = extractThumbnailFromContent(item["content:encoded"] || item.content || item.description);
            }

            const rawDescription = stripHtmlTags(item.description);
            const description = rawDescription
                ? rawDescription.substring(0, 200) + (rawDescription.length > 200 ? "..." : "")
                : "";

            return {
                id: item.guid || item.link || "",
                title: item.title || "",
                url: item.link || "",
                date: item.pubDate || new Date().toISOString(),
                platform: "note",
                description,
                thumbnail,
            };
        });

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        const errorResponse = createErrorResponse(error, "Failed to fetch Note posts");
        errorResponse.headers.set("X-RateLimit-Limit", "60");
        errorResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return errorResponse;
    }
}
