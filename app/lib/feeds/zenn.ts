import Parser from "rss-parser";
import type { Post } from "../types";
import { stripHtmlTags, extractThumbnailFromContent } from "../shared/html-utils";
import { fetchWithTimeout } from "../fetch-with-timeout";

type CustomItem = {
    guid?: string;
    id?: string;
    title?: string;
    link?: string;
    pubDate?: string;
    description?: string;
    content?: string;
    "content:encoded"?: string;
    "media:content"?: { $: { url?: string } };
    enclosure?: { url?: string };
};

type FeedResult = { items: CustomItem[] };

const parser = new Parser({
    customFields: {
        item: ["content:encoded", "media:content", ["enclosure", { keepArray: false }]],
    },
});

const ZENN_RSS_URL = "https://zenn.dev/satory074/feed";

export async function getZennPosts(): Promise<Post[]> {
    try {
        const response = await fetchWithTimeout(ZENN_RSS_URL, { timeoutMs: 10000 });
        if (!response.ok) return [];
        const xml = await response.text();
        const result = await new Promise<FeedResult>((resolve, reject) => {
            parser.parseString(xml, (err, feed) => {
                if (err) reject(err);
                else resolve(feed as FeedResult);
            });
        });
        return result.items.map((item) => {
            let thumbnail: string | undefined;
            if (item.enclosure?.url) thumbnail = item.enclosure.url;
            else if (item["media:content"]?.$?.url) thumbnail = item["media:content"].$.url;
            else thumbnail = extractThumbnailFromContent(item["content:encoded"] || item.content);
            const rawDescription = stripHtmlTags(item.description);
            const description = rawDescription
                ? rawDescription.substring(0, 200) + (rawDescription.length > 200 ? "..." : "")
                : "";
            return {
                id: item.guid || item.id || "",
                title: item.title || "",
                url: item.link || "",
                date: item.pubDate || new Date().toISOString(),
                platform: "zenn",
                description,
                thumbnail,
                collection: "zenn",
                data: { title: item.title, pubdate: item.pubDate, link: item.link, description, thumbnail },
            };
        });
    } catch {
        return [];
    }
}
