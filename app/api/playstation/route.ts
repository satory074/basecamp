import { NextResponse } from "next/server";
import { getPlaystationPosts } from "../../lib/feeds/playstation";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getPlaystationPosts());
}
