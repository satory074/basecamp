"use client";

import FeedPosts from "../components/FeedPosts";
import type { Post } from "../lib/types";

async function fetchHatenaPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/hatena");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

export default function HatenaClient() {
    return <FeedPosts fetchPosts={fetchHatenaPosts} source="Hatena" />;
}
