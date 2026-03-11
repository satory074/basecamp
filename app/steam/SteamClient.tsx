"use client";

import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import type { Post } from "../lib/types";

async function fetchSteamPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/steam");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

function renderSteamDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    const games = new Set(
        posts.map((p) => (p as Post & { gameName?: string }).gameName).filter(Boolean)
    ).size;

    return (
        <PlatformDashboard
            platform="steam"
            stats={[
                { label: "総実績数", value: posts.length },
                { label: "ゲーム数", value: games },
            ]}
        />
    );
}

export default function SteamClient() {
    return <FeedPosts fetchPosts={fetchSteamPosts} source="Steam" renderDashboard={renderSteamDashboard} />;
}
