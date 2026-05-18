import { NextResponse } from "next/server";
import { getFF14Character } from "../../lib/feeds/ff14";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getFF14Character());
}
