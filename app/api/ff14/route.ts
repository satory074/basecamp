import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ApiError, createErrorResponse } from "../../lib/api-errors";

export const revalidate = 3600;

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), "public/data/ff14-character.json");
        const fileContent = await fs.readFile(filePath, "utf-8");

        let data: Record<string, unknown>;
        try {
            data = JSON.parse(fileContent) as Record<string, unknown>;
        } catch {
            throw new ApiError("Invalid ff14-character.json format", 500, "INVALID_JSON");
        }

        const jsonResponse = NextResponse.json(data);
        jsonResponse.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=21600");
        return jsonResponse;
    } catch (error) {
        const errorResponse = createErrorResponse(error, "Failed to fetch FF14 character data");
        return errorResponse;
    }
}
