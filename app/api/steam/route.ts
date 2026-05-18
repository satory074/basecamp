import { NextResponse } from "next/server";
import { getSteamPosts } from "../../lib/feeds/steam";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getSteamPosts());
}
