"use client";

import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import type { Post } from "../lib/types";

async function fetchAppleHealthPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/applehealth");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

function renderDashboard(posts: Post[]) {
    if (posts.length === 0) return null;

    let totalDistanceKm = 0;
    let totalKcal = 0;
    let totalSeconds = 0;
    for (const p of posts) {
        const w = p as Post & { distanceKm?: number; durationSeconds?: number; kcal?: number };
        if (typeof w.distanceKm === "number") totalDistanceKm += w.distanceKm;
        if (typeof w.durationSeconds === "number") totalSeconds += w.durationSeconds;
        if (typeof w.kcal === "number") totalKcal += w.kcal;
    }
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    return (
        <PlatformDashboard
            platform="applehealth"
            stats={[
                { label: "ワークアウト", value: posts.length },
                { label: "総距離", value: `${totalDistanceKm.toFixed(1)} km` },
                { label: "総時間", value: `${totalHours} h` },
                { label: "消費カロリー", value: `${Math.round(totalKcal).toLocaleString()} kcal` },
            ]}
        />
    );
}

export default function AppleHealthClient() {
    return <FeedPosts fetchPosts={fetchAppleHealthPosts} source="Apple Health" renderDashboard={renderDashboard} />;
}
