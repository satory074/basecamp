import { NextRequest, NextResponse } from "next/server";
import { readFeedFresh, writeFeedJson } from "@/app/lib/feed-storage";
import {
    parseHealthAutoExportPayload,
    type AppleHealthFeed,
    type AppleHealthWorkoutEntry,
} from "@/app/lib/applehealth";

export const dynamic = "force-dynamic";

const FEED_FILE = "applehealth-feed.json";
const MAX_ENTRIES = 365 * 4; // 4 年分くらいの workout を保持

function unauthorized(reason: string) {
    return NextResponse.json({ error: "Unauthorized", reason }, { status: 401 });
}

function isValidBearer(req: NextRequest): boolean {
    // Secret Manager に末尾改行が混入する事故が起きやすいので両側を trim する
    const expected = (process.env.HEALTHKIT_INGEST_SECRET ?? "").trim();
    if (!expected) return false;
    const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
    if (!header) return false;
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return false;
    const got = match[1].trim();
    if (got.length !== expected.length) return false;
    // 等長比較 (timing attack 対策は本気では不要だがコスト低)
    let diff = 0;
    for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
}

export async function POST(request: NextRequest) {
    if (!process.env.HEALTHKIT_INGEST_SECRET) {
        return unauthorized("HEALTHKIT_INGEST_SECRET not configured");
    }
    if (!isValidBearer(request)) {
        return unauthorized("invalid or missing bearer token");
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const incoming = parseHealthAutoExportPayload(body);
    if (incoming.length === 0) {
        return NextResponse.json({ ok: true, accepted: 0, added: 0, total: 0, message: "no valid workouts in payload" });
    }

    const existing = await readFeedFresh<AppleHealthFeed>(FEED_FILE, { lastUpdated: "", workouts: [] });
    const map = new Map<string, AppleHealthWorkoutEntry>();
    for (const w of existing.workouts ?? []) map.set(w.id, w);

    let added = 0;
    for (const w of incoming) {
        if (!map.has(w.id)) added++;
        map.set(w.id, w); // 既存も最新値で上書き (workout 内訳が後から確定するケースに対応)
    }

    const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const trimmed = merged.slice(0, MAX_ENTRIES);

    const output: AppleHealthFeed = {
        lastUpdated: new Date().toISOString(),
        workouts: trimmed,
    };
    await writeFeedJson(FEED_FILE, output);

    return NextResponse.json({
        ok: true,
        accepted: incoming.length,
        added,
        total: trimmed.length,
    });
}
