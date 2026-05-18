import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";

interface DiaryEntry {
    id: string;
    date: string;
    title: string;
    content: string;
}

interface DiaryFeedData {
    lastUpdated: string;
    entries: DiaryEntry[];
}

export async function getDiaryPosts(): Promise<Post[]> {
    try {
        const data = await readFeedJson<DiaryFeedData>("diary-feed.json");
        const posts: Post[] = (data.entries ?? []).map((entry) => ({
            id: entry.id,
            title: entry.title,
            url: "#",
            date: entry.date,
            platform: "diary",
            description: entry.content,
        }));
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}
