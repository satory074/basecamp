import { NextResponse } from "next/server";
import { getFilmarksPosts } from "../../lib/feeds/filmarks";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getFilmarksPosts());
}
