import { NextResponse, NextRequest } from "next/server";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { createErrorResponse } from "../../lib/api-errors";
import { readFeedJson } from "../../lib/feed-storage";

export const revalidate = 3600;

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

interface DuolingoEntry {
    id: string;
    date: string;
    title: string;
    description: string;
    category: "daily" | "milestone";
    xpGained: number;
    streak: number;
}

interface DuolingoStatsData {
    username: string;
    lastUpdated: string;
    currentStats: {
        streak: number;
        totalXp: number;
        courses: Array<{ title: string; learningLanguage: string; xp: number }>;
    };
    entries: DuolingoEntry[];
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
        const data = await readFeedJson<DuolingoStatsData>("duolingo-stats.json");

        const posts: Post[] = data.entries.map((entry) => ({
            id: entry.id,
            title: entry.title,
            url: `https://www.duolingo.com/profile/${data.username}`,
            date: entry.date,
            platform: "duolingo",
            description: entry.description,
            category: entry.category,
        }));

        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=21600");
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        const errorResponse = createErrorResponse(error, "Failed to fetch Duolingo posts");
        errorResponse.headers.set("X-RateLimit-Limit", "60");
        errorResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return errorResponse;
    }
}
