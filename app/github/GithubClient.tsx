"use client";

import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
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

function renderGithubDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    const totalStars = posts.reduce((sum, p) => sum + ((p as Post & { stars?: number }).stars ?? 0), 0);
    const languages = posts
        .map((p) => (p as Post & { language?: string }).language)
        .filter((l): l is string => Boolean(l));
    const topLang = languages.length > 0
        ? Object.entries(languages.reduce<Record<string, number>>((acc, l) => { acc[l] = (acc[l] ?? 0) + 1; return acc; }, {}))
            .sort((a, b) => b[1] - a[1])[0][0]
        : "—";
    const latest = posts[0]?.date ? new Date(posts[0].date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" }) : "—";

    return (
        <PlatformDashboard
            platform="github"
            stats={[
                { label: "リポジトリ", value: posts.length },
                { label: "総スター数", value: totalStars },
                { label: "主要言語", value: topLang },
                { label: "最終更新", value: latest },
            ]}
        />
    );
}

export default function GithubClient() {
    return <FeedPosts fetchPosts={fetchGithubPosts} source="GitHub" renderDashboard={renderGithubDashboard} />;
}
