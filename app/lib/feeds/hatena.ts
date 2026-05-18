import Parser from "rss-parser";
import { config } from "../config";
import type { Post } from "../types";
import { extractThumbnailFromContent } from "../shared/html-utils";
import { fetchWithTimeout } from "../fetch-with-timeout";

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

export async function getHatenaPosts(): Promise<Post[]> {
    try {
        const response = await fetchWithTimeout(HATENA_RSS_URL, { timeoutMs: 10000 });
        if (!response.ok) return [];
        const xml = await response.text();
        const feed = await new Promise<FeedResult>((resolve, reject) => {
            parser.parseString(xml, (err, parsedFeed) => {
                if (err) reject(err);
                else resolve(parsedFeed as FeedResult);
            });
        });
        return feed.items.map((item) => {
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
                data: { description, thumbnail },
            };
        });
    } catch {
        return [];
    }
}
