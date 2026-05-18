import { NextResponse } from "next/server";
import { getSwarmPosts } from "../../lib/feeds/swarm";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getSwarmPosts());
}
