import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";

interface AchievementEntry {
    id: string;
    appId: number;
    /** ストアの日本語名 */
    gameName: string;
    title: string;
    /** 実績の説明文 (隠し実績は "") */
    detail?: string;
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
            description: ach.detail || undefined,
            thumbnail: ach.icon || undefined,
            // ゲーム名は stat ピル (PlayStation と同じ形) と /steam のゲーム別集計に使う
            data: { gameName: ach.gameName, stats: [{ key: "game", icon: "🎮", label: "", value: ach.gameName }] },
        }));
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}
