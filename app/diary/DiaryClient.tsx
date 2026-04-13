"use client";

import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import type { Post } from "../lib/types";

async function fetchDiaryPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/diary");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

function renderDiaryDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    const latest = posts[0]?.date
        ? new Date(posts[0].date).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })
        : "—";

    return (
        <PlatformDashboard
            platform="diary"
            stats={[
                { label: "総エントリ数", value: posts.length },
                { label: "最新投稿", value: latest },
            ]}
        />
    );
}

export default function DiaryClient() {
    return <FeedPosts fetchPosts={fetchDiaryPosts} source="Diary" renderDashboard={renderDiaryDashboard} />;
}
