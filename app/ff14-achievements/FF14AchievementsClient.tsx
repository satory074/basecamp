"use client";

import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import type { Post } from "../lib/types";

async function fetchFF14AchievementsPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/ff14-achievements");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

function renderFF14AchievementsDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    return (
        <PlatformDashboard
            platform="ff14-achievement"
            stats={[
                { label: "総実績数", value: posts.length },
            ]}
        />
    );
}

export default function FF14AchievementsClient() {
    return <FeedPosts fetchPosts={fetchFF14AchievementsPosts} source="FF14 Achievement" renderDashboard={renderFF14AchievementsDashboard} />;
}
