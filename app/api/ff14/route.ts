import { NextResponse } from "next/server";
import { createErrorResponse } from "../../lib/api-errors";
import { readFeedJson } from "../../lib/feed-storage";

export const revalidate = 3600;

export async function GET() {
    try {
        const data = await readFeedJson<Record<string, unknown>>("ff14-character.json");

        const jsonResponse = NextResponse.json(data);
        jsonResponse.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=21600");
        return jsonResponse;
    } catch (error) {
        const errorResponse = createErrorResponse(error, "Failed to fetch FF14 character data");
        return errorResponse;
    }
}
