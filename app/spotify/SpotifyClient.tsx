"use client";

import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import type { Post } from "../lib/types";

async function fetchSpotifyPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/spotify");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

function renderSpotifyDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    const artists = posts
        .map((p) => (p as Post & { artist?: string }).artist)
        .filter((a): a is string => Boolean(a));
    const uniqueArtists = new Set(artists).size;
    const latest = posts[0]?.title ?? "—";

    return (
        <PlatformDashboard
            platform="spotify"
            stats={[
                { label: "トラック数", value: posts.length },
                { label: "ユニークアーティスト", value: uniqueArtists },
                { label: "最新曲", value: latest.length > 20 ? latest.slice(0, 20) + "…" : latest },
            ]}
        />
    );
}

export default function SpotifyClient() {
    return <FeedPosts fetchPosts={fetchSpotifyPosts} source="Spotify" renderDashboard={renderSpotifyDashboard} />;
}
