import { NextResponse } from "next/server";
import type { Post } from "@/app/lib/types";
import { createErrorResponse } from "@/app/lib/api-errors";
import { readFeedJson } from "@/app/lib/feed-storage";
import type { AppleHealthFeed } from "@/app/lib/applehealth";

export const revalidate = 300;

export async function GET() {
    try {
        const data = await readFeedJson<AppleHealthFeed>("applehealth-feed.json").catch(() => ({
            lastUpdated: "",
            workouts: [],
            dailyActivity: [],
            stateOfMind: [],
        }));

        const workoutPosts: Post[] = (data.workouts ?? []).map((w) => ({
            id: w.id,
            title: w.title,
            url: "#",
            date: w.date,
            platform: "applehealth",
            category: "workout",
            description: w.description,
            data: {
                workoutType: w.workoutType,
                durationSeconds: w.durationSeconds,
                distanceKm: w.distanceKm,
                kcal: w.kcal,
            },
            ...(w.workoutType ? { workoutType: w.workoutType } : {}),
            ...(typeof w.durationSeconds === "number" ? { durationSeconds: w.durationSeconds } : {}),
            ...(typeof w.distanceKm === "number" ? { distanceKm: w.distanceKm } : {}),
            ...(typeof w.kcal === "number" ? { kcal: w.kcal } : {}),
        }));

        const dailyPosts: Post[] = (data.dailyActivity ?? []).map((d) => ({
            id: d.id,
            title: d.title,
            url: "#",
            date: d.date,
            platform: "applehealth",
            category: "daily",
            data: {
                steps: d.steps,
                exerciseMinutes: d.exerciseMinutes,
                activeKcal: d.activeKcal,
            },
            ...(typeof d.steps === "number" ? { steps: d.steps } : {}),
            ...(typeof d.exerciseMinutes === "number" ? { exerciseMinutes: d.exerciseMinutes } : {}),
            ...(typeof d.activeKcal === "number" ? { activeKcal: d.activeKcal } : {}),
        }));

        // associations は Post に乗せない (永続化のみ・UI 非表示)
        const moodPosts: Post[] = (data.stateOfMind ?? []).map((m) => ({
            id: m.id,
            title: m.title,
            url: "#",
            date: m.date,
            platform: "applehealth",
            category: "mood",
            data: {
                kind: m.kind,
                valence: m.valence,
                valenceClassification: m.valenceClassification,
                labels: m.labels,
            },
            ...(typeof m.valence === "number" ? { valence: m.valence } : {}),
            ...(typeof m.valenceClassification === "number" ? { valenceClassification: m.valenceClassification } : {}),
            ...(m.labels.length > 0 ? { labels: m.labels } : {}),
        }));

        const posts = [...workoutPosts, ...dailyPosts, ...moodPosts].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        const res = NextResponse.json(posts);
        res.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
        return res;
    } catch (error) {
        return createErrorResponse(error, "Failed to fetch Apple Health posts");
    }
}
