"use client";

import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import { BarChart } from "../components/charts";
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

    // Artist track count top 10
    const artistCounts = artists.reduce<Record<string, number>>((acc, a) => {
        acc[a] = (acc[a] ?? 0) + 1;
        return acc;
    }, {});
    const artistData = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, value]) => ({ label, value }));

    return (
        <>
            <PlatformDashboard
                platform="spotify"
                stats={[
                    { label: "トラック数", value: posts.length },
                    { label: "ユニークアーティスト", value: uniqueArtists },
                    { label: "最新曲", value: latest.length > 20 ? latest.slice(0, 20) + "…" : latest },
                ]}
            />
            {artistData.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                    <BarChart
                        data={artistData}
                        platformColor="var(--color-spotify)"
                        horizontal
                        title="アーティスト別トラック数 Top10"
                    />
                </div>
            )}
        </>
    );
}

export default function SpotifyClient() {
    return <FeedPosts fetchPosts={fetchSpotifyPosts} source="Spotify" renderDashboard={renderSpotifyDashboard} />;
}
