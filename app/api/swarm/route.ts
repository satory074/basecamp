import { NextResponse, NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { ApiError, createErrorResponse } from "../../lib/api-errors";

export const revalidate = 3600;

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

interface SwarmCheckinEntry {
    id: string;
    date: string;
    venueName: string;
    venueCategory?: string;
    city?: string;
    lat?: number;
    lng?: number;
    shout?: string;
    url: string;
}

interface SwarmCheckinsData {
    lastUpdated: string;
    checkins: SwarmCheckinEntry[];
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
        const filePath = path.join(process.cwd(), "public/data/swarm-checkins.json");
        const fileContent = await fs.readFile(filePath, "utf-8");

        let data: SwarmCheckinsData;
        try {
            data = JSON.parse(fileContent) as SwarmCheckinsData;
        } catch {
            throw new ApiError("Invalid swarm-checkins.json format", 500, "INVALID_JSON");
        }

        const posts: Post[] = data.checkins.map((checkin) => {
            const metaParts: string[] = [];
            if (checkin.venueCategory) metaParts.push(checkin.venueCategory);
            if (checkin.city) metaParts.push(checkin.city);
            const meta = metaParts.join(" · ");
            const description = checkin.shout || meta || undefined;

            return {
                id: `swarm-${checkin.id}`,
                title: checkin.venueName,
                url: checkin.url,
                date: checkin.date,
                platform: "swarm",
                description,
                category: checkin.venueCategory,
            };
        });

        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=21600");
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        const errorResponse = createErrorResponse(error, "Failed to fetch Swarm posts");
        errorResponse.headers.set("X-RateLimit-Limit", "60");
        errorResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return errorResponse;
    }
}
