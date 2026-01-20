import { NextResponse, NextRequest } from "next/server";
import Parser from "rss-parser";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { ApiError } from "../../lib/api-errors";

export const revalidate = 21600; // ISR: 6時間ごとに再生成

// Hatena BookmarkのRSSはRDF形式（RSS 1.0）
interface CustomItem {
    title?: string;
    link?: string;
    "dc:date"?: string;
    "dc:creator"?: string;
    description?: string;
    "content:encoded"?: string;
    "hatena:bookmarkcount"?: string;
}

// parserにカスタムフィールドを認識させる（RDF形式対応）
const parser = new Parser<{ item: CustomItem }>({
    customFields: {
        item: ["dc:date", "dc:creator", "content:encoded", "hatena:bookmarkcount", "description"],
    },
});

const HATENABOOKMARK_RSS_URL = `https://b.hatena.ne.jp/${config.profiles.hatenabookmark.username}/rss`;

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

// content:encodedからサムネイル画像を抽出
function extractBookmarkThumbnail(content?: string): string | undefined {
    if (!content) return undefined;

    // entry-imageクラスのimg要素を優先的に探す
    const entryImageMatch = content.match(/<img[^>]+class="[^"]*entry-image[^"]*"[^>]+src=["']([^"']+)["']/i);
    if (entryImageMatch) {
        return entryImageMatch[1].replace(/^http:/, "https:");
    }

    // srcが先にある場合のパターン
    const srcFirstMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]+class="[^"]*entry-image[^"]*"/i);
    if (srcFirstMatch) {
        return srcFirstMatch[1].replace(/^http:/, "https:");
    }

    // フォールバック: 最初のimg要素（ファビコンとsmallアイコンは除外）
    const imgMatch = content.match(/<img[^>]+src=["'](https?:\/\/(?!cdn-ak2\.favicon)[^"']+)["']/i);
    if (imgMatch && !imgMatch[1].includes('/small/')) {
        return imgMatch[1].replace(/^http:/, "https:");
    }

    return undefined;
}

// HTMLタグを除去してdescriptionを整形
function stripHtml(html?: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
}

export async function GET(request: NextRequest) {
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
        const feed = await parser.parseURL(HATENABOOKMARK_RSS_URL).catch(() => {
            throw new ApiError(
                "Failed to parse Hatena Bookmark RSS feed",
                502,
                "RSS_PARSE_ERROR"
            );
        });

        const posts: Post[] = feed.items.map((item) => {
            // サムネイル取得: content:encodedから抽出
            const thumbnail = extractBookmarkThumbnail(item["content:encoded"]);

            // ブックマーク数を数値に変換
            const bookmarkCount = item["hatena:bookmarkcount"]
                ? parseInt(item["hatena:bookmarkcount"], 10)
                : undefined;

            // 説明文: descriptionが空の場合はcontent:encodedからHTMLタグ除去
            const rawDescription = item.description || stripHtml(item["content:encoded"]);
            const description = rawDescription
                ? rawDescription.substring(0, 200) + (rawDescription.length > 200 ? "..." : "")
                : "";

            return {
                id: item.link || `hatenabookmark-${Date.now()}-${Math.random()}`,
                title: item.title || "",
                url: item.link || "",
                date: item["dc:date"] || new Date().toISOString(),
                platform: "hatenabookmark",
                description: description,
                thumbnail: thumbnail,
                likes: bookmarkCount, // ブックマーク数をlikesとして表示
            };
        });

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set('X-RateLimit-Limit', '60');
        jsonResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
        return jsonResponse;
    } catch (error) {
        console.error("Hatena Bookmark API error:", error);
        // エラー時は空配列を返す（map()エラー防止）
        const jsonResponse = NextResponse.json([]);
        jsonResponse.headers.set('X-RateLimit-Limit', '60');
        jsonResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
        return jsonResponse;
    }
}
