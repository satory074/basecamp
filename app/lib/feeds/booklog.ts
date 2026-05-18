import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";

interface BooklogFeedEntry {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: string;
    description: string;
    thumbnail?: string;
    rating?: number;
    finishedDate?: string;
    tags?: string[];
    category?: string;
}

interface BooklogFeedData {
    lastUpdated: string;
    posts: BooklogFeedEntry[];
}

export async function getBooklogPosts(): Promise<Post[]> {
    try {
        const data = await readFeedJson<BooklogFeedData>("booklog-feed.json");
        const posts: Post[] = data.posts.map((entry) => ({
            id: entry.id,
            title: entry.title,
            url: entry.url,
            date: entry.date,
            platform: "booklog" as const,
            description: entry.description,
            thumbnail: entry.thumbnail,
            rating: entry.rating,
            finishedDate: entry.finishedDate,
            tags: entry.tags,
            category: entry.category,
        }));
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}
