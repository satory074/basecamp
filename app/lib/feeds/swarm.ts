import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";

interface SwarmCheckinEntry {
    id: string;
    date: string;
    venueName: string;
    venueCategory?: string;
    city?: string;
    lat?: number;
    lng?: number;
    shout?: string;
    url: string;
}

interface SwarmCheckinsData {
    lastUpdated: string;
    checkins: SwarmCheckinEntry[];
}

export async function getSwarmPosts(): Promise<Post[]> {
    try {
        const data = await readFeedJson<SwarmCheckinsData>("swarm-checkins.json");
        const posts: Post[] = data.checkins.map((checkin) => {
            const metaParts: string[] = [];
            if (checkin.venueCategory) metaParts.push(checkin.venueCategory);
            if (checkin.city) metaParts.push(checkin.city);
            const meta = metaParts.join(" · ");
            const description = checkin.shout || meta || undefined;
            return {
                id: `swarm-${checkin.id}`,
                title: checkin.venueName,
                url: checkin.url,
                date: checkin.date,
                platform: "swarm",
                description,
                category: checkin.venueCategory,
            };
        });
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}
