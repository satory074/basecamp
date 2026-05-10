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
        }));

        const posts: Post[] = (data.workouts ?? []).map((w) => ({
            id: w.id,
            title: w.title,
            url: "#",
            date: w.date,
            platform: "applehealth",
            description: w.description,
            category: w.workoutType,
            data: {
                workoutType: w.workoutType,
                durationSeconds: w.durationSeconds,
                distanceKm: w.distanceKm,
                kcal: w.kcal,
            },
            // 直接フィールドにも展開 (adapter からの参照用)
            ...(w.workoutType ? { workoutType: w.workoutType } : {}),
            ...(typeof w.durationSeconds === "number" ? { durationSeconds: w.durationSeconds } : {}),
            ...(typeof w.distanceKm === "number" ? { distanceKm: w.distanceKm } : {}),
            ...(typeof w.kcal === "number" ? { kcal: w.kcal } : {}),
        }));

        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const res = NextResponse.json(posts);
        res.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
        return res;
    } catch (error) {
        return createErrorResponse(error, "Failed to fetch Apple Health posts");
    }
}
