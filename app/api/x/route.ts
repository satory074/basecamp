import { NextResponse, NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { ApiError, createErrorResponse } from "../../lib/api-errors";

export const revalidate = 21600;

const USERNAME = "satory074";
const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

interface TweetEntry {
    id: string;
    date: string;
    category: "post" | "like" | "bookmark";
    description?: string;
    isRetweet?: boolean;
}

interface XTweetsData {
    username: string;
    tweets: TweetEntry[];
}

function categoryToTitle(category: string): string {
    switch (category) {
        case "post":
            return "Post";
        case "like":
            return "Like";
        case "bookmark":
            return "Bookmark";
        default:
            return "Post";
    }
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
        const filePath = path.join(process.cwd(), "public/data/x-tweets.json");
        const fileContent = await fs.readFile(filePath, "utf-8");

        let data: XTweetsData;
        try {
            data = JSON.parse(fileContent) as XTweetsData;
        } catch {
            throw new ApiError("Invalid x-tweets.json format", 500, "INVALID_JSON");
        }

        const posts = data.tweets.map((tweet) => ({
            id: `x-${tweet.id}`,
            title: categoryToTitle(tweet.category),
            url: `https://x.com/${data.username || USERNAME}/status/${tweet.id}`,
            date: tweet.date,
            platform: "x" as const,
            description: tweet.description,
            category: tweet.category,
            isRetweet: tweet.isRetweet ?? tweet.description?.startsWith("RT @") ?? false,
        }));

        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        const errorResponse = createErrorResponse(error, "Failed to fetch X posts");
        errorResponse.headers.set("X-RateLimit-Limit", "60");
        errorResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return errorResponse;
    }
}
