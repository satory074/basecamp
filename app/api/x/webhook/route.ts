import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "../../../lib/firebase-admin";
import { rateLimit } from "../../../lib/rate-limit";

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 60 });

interface WebhookBody {
    tweetUrl: string;
    text?: string;
    createdAt?: string;
    category?: "post" | "like";
}

function extractTweetId(url: string): string | null {
    // https://x.com/user/status/123456 or https://twitter.com/user/status/123456
    const match = url.match(/\/status\/(\d+)/);
    return match ? match[1] : null;
}

function parseIftttDate(dateStr: string): string {
    // IFTTT format: "February 8, 2026 at 10:30AM"
    const cleaned = dateStr.replace(" at ", " ");
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
    }
    // Fallback: try direct parsing
    const fallback = new Date(dateStr);
    return !isNaN(fallback.getTime()) ? fallback.toISOString() : new Date().toISOString();
}

export async function POST(request: NextRequest) {
    // API key authentication
    const apiKey = request.nextUrl.searchParams.get("key");
    const expectedKey = process.env.X_WEBHOOK_API_KEY;

    // Temporary debug endpoint - remove after verification
    if (request.nextUrl.searchParams.get("debug") === "env") {
        return NextResponse.json({
            hasExpectedKey: !!expectedKey,
            expectedKeyLength: expectedKey?.length ?? 0,
            hasApiKey: !!apiKey,
            apiKeyLength: apiKey?.length ?? 0,
            match: apiKey === expectedKey,
            hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
            hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
            envKeysContaining_X: Object.keys(process.env).filter(k => k.includes("WEBHOOK") || k.includes("X_")).join(","),
        });
    }

    if (!expectedKey || apiKey !== expectedKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const { success } = await limiter(request);
    if (!success) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    try {
        const body: WebhookBody = await request.json();

        if (!body.tweetUrl) {
            return NextResponse.json({ error: "tweetUrl is required" }, { status: 400 });
        }

        const tweetId = extractTweetId(body.tweetUrl);
        if (!tweetId) {
            return NextResponse.json({ error: "Invalid tweet URL" }, { status: 400 });
        }

        const db = getFirestoreDb();
        if (!db) {
            return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
        }

        const date = body.createdAt ? parseIftttDate(body.createdAt) : new Date().toISOString();

        await db.collection("x_tweets").doc(tweetId).set({
            tweet_id: tweetId,
            date,
            category: body.category || "post",
            description: body.text || "",
            created_at: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, tweetId });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
