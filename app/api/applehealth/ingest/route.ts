import { NextRequest, NextResponse } from "next/server";
import { readFeedFresh, writeFeedJson } from "@/app/lib/feed-storage";
import {
    parseHealthAutoExportPayload,
    type AppleHealthFeed,
    type AppleHealthWorkoutEntry,
    type DailyActivityEntry,
    type StateOfMindEntry,
} from "@/app/lib/applehealth";

export const dynamic = "force-dynamic";

const FEED_FILE = "applehealth-feed.json";
const MAX_WORKOUTS = 365 * 4;       // ~4 年分
const MAX_DAILY = 365 * 4;          // ~4 年分の日次集約
const MAX_MOOD = 365 * 10;          // 1 日複数ログを想定して多めに

function unauthorized(reason: string) {
    return NextResponse.json({ error: "Unauthorized", reason }, { status: 401 });
}

function isValidBearer(req: NextRequest): boolean {
    const expected = (process.env.HEALTHKIT_INGEST_SECRET ?? "").trim();
    if (!expected) return false;
    const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
    if (!header) return false;
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return false;
    const got = match[1].trim();
    if (got.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
}

interface MergeResult<T> {
    items: T[];
    added: number;
}

/** id ベース dedup マージ。incoming で existing を上書き、件数 cap を date desc 順で適用 */
function mergeById<T extends { id: string; date: string }>(
    existing: T[],
    incoming: T[],
    maxEntries: number,
): MergeResult<T> {
    const map = new Map<string, T>();
    for (const e of existing) map.set(e.id, e);

    let added = 0;
    for (const e of incoming) {
        if (!map.has(e.id)) added++;
        map.set(e.id, e);
    }

    const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return { items: merged.slice(0, maxEntries), added };
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
    const totalAccepted =
        incoming.workouts.length + incoming.dailyActivity.length + incoming.stateOfMind.length;

    if (totalAccepted === 0) {
        return NextResponse.json({
            ok: true,
            accepted: { workouts: 0, daily: 0, mood: 0 },
            added: { workouts: 0, daily: 0, mood: 0 },
            total: { workouts: 0, daily: 0, mood: 0 },
            message: "no recognized entries in payload",
        });
    }

    const existing = await readFeedFresh<AppleHealthFeed>(FEED_FILE, {
        lastUpdated: "",
        workouts: [],
        dailyActivity: [],
        stateOfMind: [],
    });

    const workouts = mergeById<AppleHealthWorkoutEntry>(
        existing.workouts ?? [], incoming.workouts, MAX_WORKOUTS);
    const daily = mergeById<DailyActivityEntry>(
        existing.dailyActivity ?? [], incoming.dailyActivity, MAX_DAILY);
    const mood = mergeById<StateOfMindEntry>(
        existing.stateOfMind ?? [], incoming.stateOfMind, MAX_MOOD);

    const output: AppleHealthFeed = {
        lastUpdated: new Date().toISOString(),
        workouts: workouts.items,
        dailyActivity: daily.items,
        stateOfMind: mood.items,
    };
    await writeFeedJson(FEED_FILE, output);

    return NextResponse.json({
        ok: true,
        accepted: {
            workouts: incoming.workouts.length,
            daily: incoming.dailyActivity.length,
            mood: incoming.stateOfMind.length,
        },
        added: {
            workouts: workouts.added,
            daily: daily.added,
            mood: mood.added,
        },
        total: {
            workouts: workouts.items.length,
            daily: daily.items.length,
            mood: mood.items.length,
        },
    });
}
