import Parser from "rss-parser";
import { config } from "../config";
import type { Post } from "../types";

interface CustomItem {
    title?: string;
    link?: string;
    "dc:date"?: string;
    "dc:creator"?: string;
    description?: string;
    "content:encoded"?: string;
    "hatena:bookmarkcount"?: string;
}

const parser = new Parser<{ item: CustomItem }>({
    customFields: {
        item: ["dc:date", "dc:creator", "content:encoded", "hatena:bookmarkcount", "description"],
    },
});

const HATENABOOKMARK_RSS_URL = `https://b.hatena.ne.jp/${config.profiles.hatenabookmark.username}/rss`;

function extractBookmarkThumbnail(content?: string): string | undefined {
    if (!content) return undefined;
    const entryImageMatch = content.match(/<img[^>]+class="[^"]*entry-image[^"]*"[^>]+src=["']([^"']+)["']/i);
    if (entryImageMatch) return entryImageMatch[1].replace(/^http:/, "https:");
    const srcFirstMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]+class="[^"]*entry-image[^"]*"/i);
    if (srcFirstMatch) return srcFirstMatch[1].replace(/^http:/, "https:");
    const imgMatch = content.match(/<img[^>]+src=["'](https?:\/\/(?!cdn-ak2\.favicon)[^"']+)["']/i);
    if (imgMatch && !imgMatch[1].includes("/small/")) return imgMatch[1].replace(/^http:/, "https:");
    return undefined;
}

function stripHtml(html?: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
}

export async function getHatenaBookmarkPosts(): Promise<Post[]> {
    try {
        const feed = await parser.parseURL(HATENABOOKMARK_RSS_URL);
        return feed.items.map((item) => {
            const thumbnail = extractBookmarkThumbnail(item["content:encoded"]);
            const bookmarkCount = item["hatena:bookmarkcount"]
                ? parseInt(item["hatena:bookmarkcount"], 10)
                : undefined;
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
                description,
                thumbnail,
                likes: bookmarkCount,
            };
        });
    } catch {
        return [];
    }
}
