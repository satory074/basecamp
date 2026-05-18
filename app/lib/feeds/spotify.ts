import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";

interface SpotifyPlayEntry {
    id: string;
    title: string;
    artist: string;
    albumName: string;
    url: string;
    thumbnail: string;
    date: string;
}

interface SpotifyPlaysData {
    lastUpdated: string;
    plays: SpotifyPlayEntry[];
}

export async function getSpotifyPosts(): Promise<Post[]> {
    try {
        const data = await readFeedJson<SpotifyPlaysData>("spotify-plays.json");
        const posts: Post[] = data.plays.map((play) => ({
            id: play.id,
            title: play.title,
            url: play.url,
            date: play.date,
            platform: "spotify",
            description: `${play.artist} - ${play.albumName}`,
            thumbnail: play.thumbnail || undefined,
        }));
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}
