import { NextResponse } from "next/server";
import { getXPosts } from "../../lib/feeds/x";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getXPosts());
}
