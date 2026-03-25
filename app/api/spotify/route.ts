import { NextResponse, NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { ApiError, createErrorResponse } from "../../lib/api-errors";

export const revalidate = 3600;

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

interface SpotifyPlayEntry {
    id: string;
    title: string;
    artist: string;
    albumName: string;
    url: string;
    thumbnail: string;
    date: string;
}

interface SpotifyPlaysData {
    lastUpdated: string;
    plays: SpotifyPlayEntry[];
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
        const filePath = path.join(process.cwd(), "public/data/spotify-plays.json");
        const fileContent = await fs.readFile(filePath, "utf-8");

        let data: SpotifyPlaysData;
        try {
            data = JSON.parse(fileContent) as SpotifyPlaysData;
        } catch {
            throw new ApiError("Invalid spotify-plays.json format", 500, "INVALID_JSON");
        }

        const posts: Post[] = data.plays.map((play) => ({
            id: play.id,
            title: play.title,
            url: play.url,
            date: play.date,
            platform: "spotify",
            description: `${play.artist} - ${play.albumName}`,
            thumbnail: play.thumbnail || undefined,
        }));

        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=21600");
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        const errorResponse = createErrorResponse(error, "Failed to fetch Spotify posts");
        errorResponse.headers.set("X-RateLimit-Limit", "60");
        errorResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return errorResponse;
    }
}
