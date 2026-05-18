import { NextResponse } from "next/server";
import { getZennPosts } from "../../lib/feeds/zenn";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getZennPosts());
}
