import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";

interface FilmarksFeedEntry {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: string;
    description: string;
    thumbnail?: string;
    rating?: number;
}

interface FilmarksFeedData {
    lastUpdated: string;
    posts: FilmarksFeedEntry[];
}

export async function getFilmarksPosts(): Promise<Post[]> {
    try {
        const data = await readFeedJson<FilmarksFeedData>("filmarks-feed.json");
        const posts: Post[] = data.posts.map((entry) => ({
            id: entry.id,
            title: entry.title,
            url: entry.url,
            date: entry.date,
            platform: "filmarks" as const,
            description: entry.description,
            thumbnail: entry.thumbnail,
            rating: entry.rating,
        }));
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}
