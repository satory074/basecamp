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

    let workouts = 0;
    let dailyEntries = 0;
    let moodEntries = 0;
    let totalSteps = 0;
    let totalExerciseMin = 0;
    let totalWorkoutKcal = 0;

    for (const p of posts) {
        const ext = p as Post & {
            steps?: number;
            exerciseMinutes?: number;
            kcal?: number;
            activeKcal?: number;
        };
        if (p.category === "workout") {
            workouts++;
            if (typeof ext.kcal === "number") totalWorkoutKcal += ext.kcal;
        } else if (p.category === "daily") {
            dailyEntries++;
            if (typeof ext.steps === "number") totalSteps += ext.steps;
            if (typeof ext.exerciseMinutes === "number") totalExerciseMin += ext.exerciseMinutes;
        } else if (p.category === "mood") {
            moodEntries++;
        }
    }

    const totalExerciseHours = Math.round((totalExerciseMin / 60) * 10) / 10;

    const stats: { label: string; value: string | number }[] = [];
    if (dailyEntries > 0) {
        stats.push({ label: "総歩数", value: totalSteps.toLocaleString() });
        stats.push({ label: "総エクササイズ", value: `${totalExerciseHours} h` });
    }
    if (workouts > 0) {
        stats.push({ label: "ワークアウト", value: workouts });
        stats.push({ label: "ワークアウト消費", value: `${Math.round(totalWorkoutKcal).toLocaleString()} kcal` });
    }
    if (moodEntries > 0) {
        stats.push({ label: "気分ログ", value: moodEntries });
    }

    if (stats.length === 0) return null;

    return <PlatformDashboard platform="applehealth" stats={stats} />;
}

export default function AppleHealthClient() {
    return <FeedPosts fetchPosts={fetchAppleHealthPosts} source="Apple Health" renderDashboard={renderDashboard} />;
}
