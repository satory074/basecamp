import { NextResponse } from "next/server";
import { getGithubPosts } from "../../lib/feeds/github";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getGithubPosts());
}
