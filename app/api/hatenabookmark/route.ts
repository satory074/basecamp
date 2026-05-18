import { NextResponse } from "next/server";
import { getHatenaBookmarkPosts } from "../../lib/feeds/hatenabookmark";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getHatenaBookmarkPosts());
}
