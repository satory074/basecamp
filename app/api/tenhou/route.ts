import { NextResponse } from "next/server";
import { getTenhouStats } from "../../lib/feeds/tenhou";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getTenhouStats());
}
