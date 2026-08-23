"use client";

import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import type { AlcoSummary } from "../lib/feeds/alco";
import type { Post } from "../lib/types";

async function fetchAlcoPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/alco");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

interface AlcoClientProps {
    summary: AlcoSummary;
}

export default function AlcoClient({ summary }: AlcoClientProps) {
    // ストリークは休肝日側のみ表示する（連続飲酒日数は出さない）
    const renderDashboard = () => (
        <PlatformDashboard
            platform="alco"
            stats={[
                { label: "直近7日の純アルコール量", value: `${summary.last7dG}g` },
                { label: "今月の休肝日", value: `${summary.restDaysThisMonth}日` },
                { label: "休肝日ストリーク", value: `${summary.restDayStreak}日` },
            ]}
        />
    );

    return <FeedPosts fetchPosts={fetchAlcoPosts} source="alco" renderDashboard={renderDashboard} />;
}
