import { NextResponse, NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { ApiError, createErrorResponse } from "../../lib/api-errors";

export const revalidate = 3600;

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

interface FF14AchievementFeedEntry {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: string;
    description: string;
    thumbnail?: string;
}

interface FF14AchievementsFeedData {
    lastUpdated: string;
    posts: FF14AchievementFeedEntry[];
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
        const filePath = path.join(process.cwd(), "public/data/ff14-achievements-feed.json");
        const fileContent = await fs.readFile(filePath, "utf-8");

        let data: FF14AchievementsFeedData;
        try {
            data = JSON.parse(fileContent) as FF14AchievementsFeedData;
        } catch {
            throw new ApiError("Invalid ff14-achievements-feed.json format", 500, "INVALID_JSON");
        }

        const posts: Post[] = data.posts.map((entry) => ({
            id: entry.id,
            title: entry.title,
            url: entry.url,
            date: entry.date,
            platform: "ff14-achievement" as const,
            description: entry.description,
            thumbnail: entry.thumbnail,
        }));

        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=21600");
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        const errorResponse = createErrorResponse(error, "Failed to fetch FF14 achievement posts");
        errorResponse.headers.set("X-RateLimit-Limit", "60");
        errorResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return errorResponse;
    }
}
