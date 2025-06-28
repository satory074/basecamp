import { NextResponse } from "next/server";
import Parser from "rss-parser";
import type { Post } from "../../lib/types";

export const revalidate = 3600; // ISR: 1時間ごとに再生成

type CustomItem = {
  guid?: string;
  id?: string;
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  content?: string;
  'content:encoded'?: string;
  'media:content'?: {
    $: {
      url?: string;
    }
  }
};

type FeedResult = {
    items: CustomItem[];
};

// parserにカスタムフィールドを認識させる
const parser = new Parser({
  customFields: {
    item: [
      'content:encoded',
      'media:content'
    ]
  }
});

const ZENN_RSS_URL = "https://zenn.dev/satory074/feed";

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

export async function GET() {
    try {
        const response = await fetch(ZENN_RSS_URL);
        const xml = await response.text();
        const result = await new Promise<FeedResult>((resolve, reject) => {
            parser.parseString(xml, (err, feed) => {
                if (err) reject(err);
                else resolve(feed as FeedResult);
            });
        });
        const items = result.items;

        const posts: Post[] = items.map((item) => {
            // サムネイル取得: media:contentフィールドから、またはHTML内から抽出
            let thumbnail = undefined;
            if (item['media:content'] && item['media:content'].$?.url) {
                thumbnail = item['media:content'].$.url;
            } else {
                thumbnail = extractThumbnailFromContent(item['content:encoded'] || item.content);
            }

            // 説明文を整形: HTMLタグを除去して適切な長さにする
            const rawDescription = stripHtmlTags(item.description);
            const description = rawDescription
                ? rawDescription.substring(0, 200) + (rawDescription.length > 200 ? '...' : '')
                : '';

            return {
                id: item.guid || item.id || "",
                title: item.title || "",
                url: item.link || "",
                date: item.pubDate || new Date().toISOString(),
                platform: "zenn",
                description: description,
                thumbnail: thumbnail,
                collection: "zenn",
                data: {
                    title: item.title,
                    pubdate: item.pubDate,
                    link: item.link,
                    description: description,
                    thumbnail: thumbnail,
                }
            };
        });

        return NextResponse.json(posts);
    } catch (error) {
        console.error("Failed to fetch Zenn RSS:", error);
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}
