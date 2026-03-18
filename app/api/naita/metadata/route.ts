import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { fetchWithTimeout } from "@/app/lib/fetch-with-timeout";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    try {
        const response = await fetchWithTimeout(url, {
            timeoutMs: 5000,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; Basecamp/1.0)",
            },
        });

        if (!response.ok) {
            return NextResponse.json({}, { status: 200 });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const title =
            $('meta[property="og:title"]').attr("content") ||
            $("title").text() ||
            "";
        const image =
            $('meta[property="og:image"]').attr("content") ||
            "";
        const description =
            $('meta[property="og:description"]').attr("content") ||
            $('meta[name="description"]').attr("content") ||
            "";
        const siteName =
            $('meta[property="og:site_name"]').attr("content") ||
            "";

        return NextResponse.json({ title, image, description, siteName });
    } catch {
        return NextResponse.json({}, { status: 200 });
    }
}
