import Parser from "rss-parser";
import { config } from "../config";
import type { Post } from "../types";
import { stripHtmlTags, extractThumbnailFromContent } from "../shared/html-utils";
import { fetchWithTimeout } from "../fetch-with-timeout";

type CustomItem = {
    guid?: string;
    title?: string;
    link?: string;
    pubDate?: string;
    description?: string;
    content?: string;
    "content:encoded"?: string;
    enclosure?: { url?: string };
    "media:thumbnail"?: { $?: { url?: string } } | string;
    "[object Object]"?: string;
};

type FeedResult = { items: CustomItem[] };

const parser = new Parser({
    customFields: {
        item: ["content:encoded", ["enclosure", { keepArray: false }], ["media:thumbnail", { keepArray: false }]],
    },
});

const NOTE_RSS_URL = `https://note.com/${config.profiles.note.username}/rss`;

export async function getNotePosts(): Promise<Post[]> {
    try {
        const response = await fetchWithTimeout(NOTE_RSS_URL, { timeoutMs: 10000 });
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
            if (item["[object Object]"] && typeof item["[object Object]"] === "string") {
                thumbnail = item["[object Object]"];
            } else if (item["media:thumbnail"]) {
                const mt = item["media:thumbnail"];
                thumbnail = typeof mt === "string" ? mt : mt.$?.url;
            }
            if (!thumbnail && item.enclosure?.url) thumbnail = item.enclosure.url;
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
    } catch {
        return [];
    }
}
