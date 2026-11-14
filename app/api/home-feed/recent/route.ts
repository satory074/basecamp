import { NextResponse } from "next/server";
import { getHomeFeedChunks } from "../../../lib/home-feed";

export const dynamic = "force-static";

/** ホームのフィードの「recent」分 (build 時に out/api/home-feed/recent として静的 JSON になる)。説明は lib/home-feed.ts */
export async function GET() {
    const { recent } = await getHomeFeedChunks();
    return NextResponse.json(recent);
}
