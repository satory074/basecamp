"use client";

import FeedPosts from "../components/FeedPosts";
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

export default function FF14AchievementsClient() {
    return <FeedPosts fetchPosts={fetchFF14AchievementsPosts} source="FF14 Achievement" />;
}
