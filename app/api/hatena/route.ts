import { NextResponse, NextRequest } from "next/server";
import Parser from "rss-parser";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { ApiError, createErrorResponse } from "../../lib/api-errors";

export const revalidate = 3600; // ISR: 1時間ごとに再生成

// カスタム型を拡張して画像URLを含めるようにする
interface CustomItem {
    title?: string;
    link?: string;
    pubDate?: string;
    guid?: string;
    content?: string;
    contentSnippet?: string;
    "content:encoded"?: string;
    "hatena:imageurl"?: string; // Hatenaのサムネイル用
}

// parserにカスタムフィールドを認識させる
const parser = new Parser<{ item: CustomItem }>({
    customFields: {
        item: ["hatena:imageurl", "content:encoded"],
    },
});

const HATENA_RSS_URL = `https://${config.profiles.hatena.username}.hatenablog.com/rss`;

// HTMLからサムネイル画像URLを抽出する関数
function extractThumbnailFromContent(content?: string): string | undefined {
    if (!content) return undefined;

    // img タグから src 属性値を抽出
    const imgMatch = content.match(/<img.*?src="(.*?)".*?>/i);
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
                    'X-RateLimit-Limit': '60',
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': new Date(Date.now() + 60 * 60 * 1000).toISOString()
                }
            }
        );
    }
    try {
        const feed = await parser.parseURL(HATENA_RSS_URL).catch(() => {
            throw new ApiError(
                "Failed to parse Hatena RSS feed",
                502,
                "RSS_PARSE_ERROR"
            );
        });

        const posts: Post[] = feed.items.map((item) => {
            // サムネイル取得: HatenaのRSSフィールドから、またはHTMLコンテンツから抽出
            const thumbnail =
                item["hatena:imageurl"] || extractThumbnailFromContent(item["content:encoded"] || item.content);

            // 説明文を整形: contentSnippetがある場合はそれを利用
            const description = item.contentSnippet
                ? item.contentSnippet.substring(0, 200) + (item.contentSnippet.length > 200 ? "..." : "")
                : "";

            return {
                id: item.guid || item.link || "",
                title: item.title || "",
                url: item.link || "",
                date: item.pubDate || new Date().toISOString(),
                platform: "hatena",
                description: description,
                thumbnail: thumbnail,
                data: {
                    description: description,
                    thumbnail: thumbnail,
                },
            };
        });

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set('X-RateLimit-Limit', '60');
        jsonResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
        return jsonResponse;
    } catch (error) {
        return createErrorResponse(error, "Failed to fetch Hatena blog posts");
    }
}
