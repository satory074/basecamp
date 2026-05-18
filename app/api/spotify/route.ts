import { NextResponse } from "next/server";
import { getSpotifyPosts } from "../../lib/feeds/spotify";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getSpotifyPosts());
}
