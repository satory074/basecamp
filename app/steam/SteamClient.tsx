"use client";

import FeedPosts from "../components/FeedPosts";
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

export default function SteamClient() {
    return <FeedPosts fetchPosts={fetchSteamPosts} source="Steam" />;
}
