import { NextResponse } from "next/server";
import { getFF14AchievementPosts } from "../../lib/feeds/ff14-achievements";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getFF14AchievementPosts());
}
