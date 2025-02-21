import { NextResponse } from "next/server";
import Parser from "rss-parser";
import type { Post } from "../../lib/types";

type FeedResult = {
    items: {
        guid?: string;
        id?: string;
        title?: string;
        link?: string;
        pubDate?: string;
        description?: string;
    }[];
};

const parser = new Parser();
const ZENN_RSS_URL = "https://zenn.dev/satory074/feed";

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

        const posts: Post[] = items.map((item) => ({
            id: item.guid || item.id || "",
            title: item.title || "",
            url: item.link || "",
            date: item.pubDate ? new Date(item.pubDate).toLocaleDateString("ja-JP") : "",
            collection: "zenn",
            data: {
                title: item.title,
                pubdate: item.pubDate,
                link: item.link,
                description: item.description,
            },
        }));

        return NextResponse.json(posts);
    } catch (error) {
        console.error("Failed to fetch Zenn RSS:", error);
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}
