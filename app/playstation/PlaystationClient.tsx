"use client";

import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import { BarChart } from "../components/charts";
import type { Post } from "../lib/types";

async function fetchPlaystationPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/playstation");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

function renderPlaystationDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    // gameName は description に格納されている
    const gameNames = posts
        .map((p) => p.description)
        .filter((g): g is string => Boolean(g));
    const games = new Set(gameNames).size;
    const platinums = posts.filter((p) => p.category === "platinum").length;

    // Trophies per game top 10
    const gameCounts = gameNames.reduce<Record<string, number>>((acc, g) => {
        acc[g] = (acc[g] ?? 0) + 1;
        return acc;
    }, {});
    const gameData = Object.entries(gameCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, value]) => ({ label, value }));

    const stats = [
        { label: "総トロフィー数", value: posts.length },
        { label: "ゲーム数", value: games },
    ];
    if (platinums > 0) {
        stats.push({ label: "プラチナ", value: platinums });
    }

    return (
        <>
            <PlatformDashboard platform="playstation" stats={stats} />
            {gameData.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                    <BarChart
                        data={gameData}
                        platformColor="var(--color-playstation)"
                        horizontal
                        title="ゲーム別トロフィー数 Top10"
                    />
                </div>
            )}
        </>
    );
}

export default function PlaystationClient() {
    return (
        <FeedPosts
            fetchPosts={fetchPlaystationPosts}
            source="PlayStation"
            renderDashboard={renderPlaystationDashboard}
        />
    );
}
