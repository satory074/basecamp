import { NextResponse } from "next/server";
import { getSummaries } from "../../lib/feeds/summaries";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getSummaries());
}
