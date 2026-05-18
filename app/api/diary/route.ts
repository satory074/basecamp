import { NextResponse } from "next/server";
import { getDiaryPosts } from "../../lib/feeds/diary";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getDiaryPosts());
}
