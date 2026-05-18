import { NextResponse } from "next/server";
import { getHatenaPosts } from "../../lib/feeds/hatena";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getHatenaPosts());
}
