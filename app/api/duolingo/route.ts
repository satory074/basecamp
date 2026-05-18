import { NextResponse } from "next/server";
import { getDuolingoPosts } from "../../lib/feeds/duolingo";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getDuolingoPosts());
}
