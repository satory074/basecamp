import { NextResponse, NextRequest } from "next/server";
import Parser from "rss-parser";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { ApiError } from "../../lib/api-errors";

export const revalidate = 3600; // ISR: 1時間ごとに再生成

type CustomItem = {
    guid?: string;
    title?: string;
    link?: string;
    pubDate?: string;
    description?: string;
    content?: string;
    'content:encoded'?: string;
    enclosure?: {
        url?: string;
    };
    'media:thumbnail'?: {
        $?: { url?: string };
    } | string;
    // rss-parserが media:thumbnail を [object Object] キーで格納する問題への対応
    '[object Object]'?: string;
};

type FeedResult = {
    items: CustomItem[];
};

// parserにカスタムフィールドを認識させる
const parser = new Parser({
    customFields: {
        item: [
            'content:encoded',
            ['enclosure', { keepArray: false }],
            ['media:thumbnail', { keepArray: false }]
        ]
    }
});

const NOTE_RSS_URL = `https://note.com/${config.profiles.note.username}/rss`;

// HTMLからサムネイル画像URLを抽出する関数
function extractThumbnailFromContent(content?: string): string | undefined {
    if (!content) return undefined;

    // img タグから src 属性値を抽出
    const imgMatch = content.match(/<img.*?src="(.*?)".*?>/i);
    return imgMatch ? imgMatch[1] : undefined;
}

// 説明文からHTMLタグを除去する関数
function stripHtmlTags(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
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
        const response = await fetch(NOTE_RSS_URL);
        if (!response.ok) {
            throw new ApiError(
                `Failed to fetch Note RSS: ${response.status}`,
                502,
                "NOTE_FETCH_ERROR"
            );
        }
        const xml = await response.text();
        const result = await new Promise<FeedResult>((resolve, reject) => {
            parser.parseString(xml, (err, feed) => {
                if (err) {
                    reject(new ApiError(
                        "Failed to parse Note RSS feed",
                        502,
                        "RSS_PARSE_ERROR"
                    ));
                } else {
                    resolve(feed as FeedResult);
                }
            });
        });
        const items = result.items;

        const posts: Post[] = items.map((item) => {
            // サムネイル取得: media:thumbnail, enclosure, またはHTML内から抽出
            let thumbnail = undefined;

            // 1. media:thumbnail を優先（NoteのRSSではこれが使われる）
            // rss-parserが media:thumbnail を [object Object] キーで格納する問題への対応
            if (item['[object Object]'] && typeof item['[object Object]'] === 'string') {
                thumbnail = item['[object Object]'];
            } else if (item['media:thumbnail']) {
                const mediaThumbnail = item['media:thumbnail'];
                if (typeof mediaThumbnail === 'string') {
                    thumbnail = mediaThumbnail;
                } else if (mediaThumbnail.$?.url) {
                    thumbnail = mediaThumbnail.$.url;
                }
            }

            // 2. enclosure にフォールバック
            if (!thumbnail && item.enclosure?.url) {
                thumbnail = item.enclosure.url;
            }

            // 3. HTML内から抽出
            if (!thumbnail) {
                thumbnail = extractThumbnailFromContent(item['content:encoded'] || item.content || item.description);
            }

            // 説明文を整形: HTMLタグを除去して適切な長さにする
            const rawDescription = stripHtmlTags(item.description);
            const description = rawDescription
                ? rawDescription.substring(0, 200) + (rawDescription.length > 200 ? '...' : '')
                : '';

            return {
                id: item.guid || item.link || "",
                title: item.title || "",
                url: item.link || "",
                date: item.pubDate || new Date().toISOString(),
                platform: "note",
                description: description,
                thumbnail: thumbnail,
            };
        });

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set('X-RateLimit-Limit', '60');
        jsonResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
        return jsonResponse;
    } catch (error) {
        console.error("Note API error:", error);
        // Return empty array instead of error object to prevent map() errors
        const jsonResponse = NextResponse.json([]);
        jsonResponse.headers.set('X-RateLimit-Limit', '60');
        jsonResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
        return jsonResponse;
    }
}
