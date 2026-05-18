import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";

interface FF14AchievementFeedEntry {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: string;
    description: string;
    thumbnail?: string;
}

interface FF14AchievementsFeedData {
    lastUpdated: string;
    posts: FF14AchievementFeedEntry[];
}

export async function getFF14AchievementPosts(): Promise<Post[]> {
    try {
        const data = await readFeedJson<FF14AchievementsFeedData>("ff14-achievements-feed.json");
        const posts: Post[] = data.posts.map((entry) => ({
            id: entry.id,
            title: entry.title,
            url: entry.url,
            date: entry.date,
            platform: "ff14-achievement" as const,
            description: entry.description,
            thumbnail: entry.thumbnail,
        }));
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}
