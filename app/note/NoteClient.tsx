"use client";

import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import type { Post } from "../lib/types";

async function fetchNotePosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/note");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

function renderNoteDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    const latest = posts[0]?.date
        ? new Date(posts[0].date).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })
        : "—";

    return (
        <PlatformDashboard
            platform="note"
            stats={[
                { label: "総記事数", value: posts.length },
                { label: "最新投稿", value: latest },
            ]}
        />
    );
}

export default function NoteClient() {
    return <FeedPosts fetchPosts={fetchNotePosts} source="Note" renderDashboard={renderNoteDashboard} />;
}
