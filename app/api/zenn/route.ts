import { XMLParser } from "fast-xml-parser";
import { NextResponse } from "next/server";
import type { Post } from "../../lib/types";

interface ZennItem {
    guid: string;
    title: string;
    pubDate: string;
    link: string;
    description: string;
}

interface ZennFeed {
    rss: {
        channel: {
            item: ZennItem[];
        };
    };
}

export async function GET() {
    try {
        const response = await fetch("https://zenn.dev/satory074/feed", {
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch Zenn feed");
        }

        const text = await response.text();
        const parser = new XMLParser();
        const result = parser.parse(text) as ZennFeed;

        const items = result.rss.channel.item;

        const posts: Post[] = items.map((item) => ({
            collection: "zenn",
            id: item.guid,
            data: {
                title: item.title,
                pubdate: item.pubDate,
                link: item.link,
                description: item.description,
            },
        }));

        return NextResponse.json(posts);
    } catch (error) {
        console.error("Error fetching Zenn posts:", error);
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}
