import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";

interface DuolingoEntry {
    id: string;
    date: string;
    title: string;
    description: string;
    category: "daily" | "milestone";
    xpGained: number;
    streak: number;
}

interface DuolingoStatsData {
    username: string;
    lastUpdated: string;
    currentStats: {
        streak: number;
        totalXp: number;
        courses: Array<{ title: string; learningLanguage: string; xp: number }>;
    };
    entries: DuolingoEntry[];
}

export async function getDuolingoPosts(): Promise<Post[]> {
    try {
        const data = await readFeedJson<DuolingoStatsData>("duolingo-stats.json");
        const posts: Post[] = data.entries.map((entry) => ({
            id: entry.id,
            title: entry.title,
            url: `https://www.duolingo.com/profile/${data.username}`,
            date: entry.date,
            platform: "duolingo",
            description: entry.description,
            category: entry.category,
        }));
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}

export async function getDuolingoStats(): Promise<DuolingoStatsData | null> {
    try {
        return await readFeedJson<DuolingoStatsData>("duolingo-stats.json");
    } catch {
        return null;
    }
}
