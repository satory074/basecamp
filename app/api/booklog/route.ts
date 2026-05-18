import { NextResponse } from "next/server";
import { getBooklogPosts } from "../../lib/feeds/booklog";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getBooklogPosts());
}
