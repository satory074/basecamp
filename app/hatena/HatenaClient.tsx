"use client";

import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
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

function renderHatenaDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    const latest = posts[0]?.date
        ? new Date(posts[0].date).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })
        : "—";

    return (
        <PlatformDashboard
            platform="hatena"
            stats={[
                { label: "総記事数", value: posts.length },
                { label: "最新投稿", value: latest },
            ]}
        />
    );
}

export default function HatenaClient() {
    return <FeedPosts fetchPosts={fetchHatenaPosts} source="Hatena" renderDashboard={renderHatenaDashboard} />;
}
