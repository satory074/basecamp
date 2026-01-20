"use client";

import FeedPosts from "../components/FeedPosts";
import type { Post } from "../lib/types";

async function fetchHatenabookmarkPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/hatenabookmark");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

export default function HatenabookmarkClient() {
    return <FeedPosts fetchPosts={fetchHatenabookmarkPosts} source="Hatena Bookmark" />;
}
