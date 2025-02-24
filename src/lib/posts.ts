import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

export type Post = CollectionEntry<"blog" | "zenn" | "qiita">;

export async function getAllPosts() {
    const [blogPosts, zennPosts, qiitaPosts] = await Promise.all([
        getCollection("blog", ({ data }) => !data.draft),
        getCollection("zenn"),
        getCollection("qiita"),
    ]);

    return [...blogPosts, ...zennPosts, ...qiitaPosts].sort(
        (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
    );
}

export function formatDate(date: Date): string {
    return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}
