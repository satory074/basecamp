"use client";

import FeedPosts from "../components/FeedPosts";
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

export default function SpotifyClient() {
    return <FeedPosts fetchPosts={fetchSpotifyPosts} source="Spotify" />;
}
