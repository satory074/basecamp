import { NextResponse } from "next/server";
import { getAlcoPosts } from "../../lib/feeds/alco";

export const dynamic = "force-static";

export async function GET() {
    return NextResponse.json(await getAlcoPosts());
}
