"use client";

import FeedPosts from "../components/FeedPosts";
import type { Post } from "../lib/types";

async function fetchZennPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/zenn");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

export default function ZennClient() {
    return <FeedPosts fetchPosts={fetchZennPosts} source="Zenn" />;
}
