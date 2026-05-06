import { NextResponse, NextRequest } from "next/server";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { createErrorResponse } from "../../lib/api-errors";
import { readFeedJson } from "../../lib/feed-storage";

export const revalidate = 3600;

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

interface AchievementEntry {
    id: string;
    appId: number;
    gameName: string;
    title: string;
    icon: string;
    date: string;
}

interface SteamAchievementsData {
    steamId: string;
    lastUpdated: string;
    achievements: AchievementEntry[];
}

export async function GET(request: NextRequest) {
    const { success, remaining } = await limiter(request);

    if (!success) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
                status: 429,
                headers: {
                    "X-RateLimit-Limit": "60",
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                },
            }
        );
    }

    try {
        const data = await readFeedJson<SteamAchievementsData>("steam-achievements.json");

        const posts: Post[] = data.achievements.map((ach) => ({
            id: ach.id,
            title: ach.title,
            url: `https://store.steampowered.com/app/${ach.appId}`,
            date: ach.date,
            platform: "steam",
            description: ach.gameName,
            thumbnail: ach.icon || undefined,
        }));

        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=21600");
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        const errorResponse = createErrorResponse(error, "Failed to fetch Steam posts");
        errorResponse.headers.set("X-RateLimit-Limit", "60");
        errorResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return errorResponse;
    }
}
