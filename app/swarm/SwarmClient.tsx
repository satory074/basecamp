"use client";

import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import { BarChart } from "../components/charts";
import type { Post } from "../lib/types";

async function fetchSwarmPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/swarm");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

function renderSwarmDashboard(posts: Post[]) {
    if (posts.length === 0) return null;

    const categories = posts
        .map((p) => p.category)
        .filter((c): c is string => Boolean(c));
    const uniqueCategories = new Set(categories).size;

    const categoryCounts = categories.reduce<Record<string, number>>((acc, c) => {
        acc[c] = (acc[c] ?? 0) + 1;
        return acc;
    }, {});
    const categoryData = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, value]) => ({ label, value }));

    const latest = posts[0]?.title ?? "—";

    return (
        <>
            <PlatformDashboard
                platform="swarm"
                stats={[
                    { label: "チェックイン数", value: posts.length },
                    { label: "ユニークカテゴリ", value: uniqueCategories },
                    { label: "最新の場所", value: latest.length > 20 ? latest.slice(0, 20) + "…" : latest },
                ]}
            />
            {categoryData.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                    <BarChart
                        data={categoryData}
                        platformColor="var(--color-swarm)"
                        horizontal
                        title="カテゴリ別チェックイン数 Top10"
                    />
                </div>
            )}
        </>
    );
}

export default function SwarmClient() {
    return <FeedPosts fetchPosts={fetchSwarmPosts} source="Swarm" renderDashboard={renderSwarmDashboard} />;
}
