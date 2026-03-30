import { NextResponse, NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { ApiError, createErrorResponse } from "../../lib/api-errors";

export const revalidate = 3600;

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

interface BooklogFeedEntry {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: string;
    description: string;
    thumbnail?: string;
    rating?: number;
    finishedDate?: string;
    tags?: string[];
    category?: string;
}

interface BooklogFeedData {
    lastUpdated: string;
    posts: BooklogFeedEntry[];
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
        const filePath = path.join(process.cwd(), "public/data/booklog-feed.json");
        const fileContent = await fs.readFile(filePath, "utf-8");

        let data: BooklogFeedData;
        try {
            data = JSON.parse(fileContent) as BooklogFeedData;
        } catch {
            throw new ApiError("Invalid booklog-feed.json format", 500, "INVALID_JSON");
        }

        const posts: Post[] = data.posts.map((entry) => ({
            id: entry.id,
            title: entry.title,
            url: entry.url,
            date: entry.date,
            platform: "booklog" as const,
            description: entry.description,
            thumbnail: entry.thumbnail,
            rating: entry.rating,
            finishedDate: entry.finishedDate,
            tags: entry.tags,
            category: entry.category,
        }));

        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=21600");
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        const errorResponse = createErrorResponse(error, "Failed to fetch Booklog posts");
        errorResponse.headers.set("X-RateLimit-Limit", "60");
        errorResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return errorResponse;
    }
}
