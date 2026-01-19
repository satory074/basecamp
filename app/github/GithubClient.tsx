"use client";

import FeedPosts from "../components/FeedPosts";
import type { Post } from "../lib/types";

async function fetchGithubPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/github");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

export default function GithubClient() {
    return <FeedPosts fetchPosts={fetchGithubPosts} source="GitHub" />;
}
