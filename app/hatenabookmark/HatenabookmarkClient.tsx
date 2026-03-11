"use client";

import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
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

function renderHatenabookmarkDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    const latest = posts[0]?.date
        ? new Date(posts[0].date).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })
        : "—";

    return (
        <PlatformDashboard
            platform="hatenabookmark"
            stats={[
                { label: "総ブックマーク数", value: posts.length },
                { label: "最新", value: latest },
            ]}
        />
    );
}

export default function HatenabookmarkClient() {
    return <FeedPosts fetchPosts={fetchHatenabookmarkPosts} source="Hatena Bookmark" renderDashboard={renderHatenabookmarkDashboard} />;
}
