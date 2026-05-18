import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";

interface AchievementEntry {
    id: string;
    appId: number;
    gameName: string;
    title: string;
    icon: string;
    date: string;
}

interface SteamAchievementsData {
    steamId: string;
    lastUpdated: string;
    achievements: AchievementEntry[];
}

export async function getSteamPosts(): Promise<Post[]> {
    try {
        const data = await readFeedJson<SteamAchievementsData>("steam-achievements.json");
        const posts: Post[] = data.achievements.map((ach) => ({
            id: ach.id,
            title: ach.title,
            url: `https://store.steampowered.com/app/${ach.appId}`,
            date: ach.date,
            platform: "steam",
            description: ach.gameName,
            thumbnail: ach.icon || undefined,
        }));
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}
