import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";

const parser = new Parser();
const HATENA_RSS_URL = `https://${config.profiles.hatena.username}.hatenablog.com/rss`;

export async function GET() {
    try {
        const feed = await parser.parseURL(HATENA_RSS_URL);

        const posts: Post[] = feed.items.map((item) => ({
            id: item.guid || item.link || "",
            title: item.title || "",
            url: item.link || "",
            date: item.pubDate || new Date().toISOString(),
            platform: "hatena",
            description: item.contentSnippet || "",
        }));

        return NextResponse.json(posts);
    } catch (error) {
        console.error("Failed to fetch Hatena RSS:", error);
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}
