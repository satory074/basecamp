import { NextResponse } from "next/server";
import { getNotePosts } from "../../lib/feeds/note";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getNotePosts());
}
