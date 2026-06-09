import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";
import { config } from "../config";

interface TrophyEntry {
    id: string;
    npCommunicationId: string;
    gameName: string;
    title: string;
    icon: string;
    trophyType: string;
    earnedRate?: string;
    date: string;
}

interface PlaystationTrophiesData {
    accountId: string;
    lastUpdated: string;
    trophies: TrophyEntry[];
}

export async function getPlaystationPosts(): Promise<Post[]> {
    try {
        const data = await readFeedJson<PlaystationTrophiesData>("playstation-trophies.json");
        const profileUrl = `https://psnprofiles.com/${config.profiles.playstation.username}`;
        const posts: Post[] = data.trophies.map((trophy) => ({
            id: trophy.id,
            title: trophy.title,
            url: profileUrl,
            date: trophy.date,
            platform: "playstation",
            description: trophy.gameName,
            category: trophy.trophyType, // bronze/silver/gold/platinum → tier badge
            thumbnail: trophy.icon || undefined,
        }));
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}
