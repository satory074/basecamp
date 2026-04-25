/**
 * Swarm (Foursquare) チェックインフィード更新スクリプト
 *
 * Foursquare v2 API から自分のチェックインを取得し、
 * public/data/swarm-checkins.json に差分マージする。
 *
 * GitHub Actions から定期実行される想定。
 *
 * プライバシーポリシー（必須）:
 *   - 24時間ディレイ: createdAt が now-24h 以降のチェックインは保存しない
 *   - 座標丸め: lat/lng を小数3桁（約100m精度）に丸める
 *   - 同行者除去: with フィールドは保存しない
 *   - venue blocklist: SWARM_BLOCKED_VENUE_IDS のIDは除外
 *   - カテゴリ blocklist: "Home (private)" "Office" を除外
 *
 * 必要な環境変数:
 *   FOURSQUARE_ACCESS_TOKEN  - 長寿命 OAuth access token
 *   SWARM_BLOCKED_VENUE_IDS  - カンマ区切りの venue ID 列（オプション）
 *   DISCORD_WEBHOOK_URL      - Discord通知用（オプション）
 */

import * as fs from "fs";
import * as path from "path";

import { notifyIfNoteworthy } from "./lib/discord-notification";

const JSON_PATH = path.join(process.cwd(), "public/data/swarm-checkins.json");

const FOURSQUARE_API_VERSION = "20260101";
const FETCH_TIMEOUT = 10000;
const PRIVACY_DELAY_MS = 24 * 60 * 60 * 1000; // 24h
const COORD_PRECISION = 1000; // 小数3桁
const FETCH_LIMIT = 100;

const BLOCKED_CATEGORY_NAMES = new Set([
    "Home (private)",
    "Office",
]);

// ---- Types ----

interface FoursquareCheckin {
    id: string;
    createdAt: number; // unix seconds
    shout?: string;
    venue?: {
        id: string;
        name: string;
        location?: {
            lat?: number;
            lng?: number;
            city?: string;
            country?: string;
            address?: string;
        };
        categories?: Array<{ id: string; name: string }>;
    };
}

interface CheckinsResponse {
    response?: {
        checkins?: {
            count?: number;
            items?: FoursquareCheckin[];
        };
    };
}

interface SwarmCheckinEntry {
    id: string;
    date: string;
    venueName: string;
    venueCategory?: string;
    city?: string;
    lat?: number;
    lng?: number;
    shout?: string;
    url: string;
}

interface SwarmCheckinsFile {
    lastUpdated: string;
    checkins: SwarmCheckinEntry[];
}

// ---- Helpers ----

function getEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not set`);
    return value;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

function roundCoord(value: number | undefined): number | undefined {
    if (value === undefined || Number.isNaN(value)) return undefined;
    return Math.round(value * COORD_PRECISION) / COORD_PRECISION;
}

function loadExisting(): SwarmCheckinsFile {
    try {
        const content = fs.readFileSync(JSON_PATH, "utf-8");
        const parsed = JSON.parse(content) as SwarmCheckinsFile;
        return {
            lastUpdated: parsed.lastUpdated ?? "",
            checkins: parsed.checkins ?? [],
        };
    } catch {
        return { lastUpdated: "", checkins: [] };
    }
}

// ---- API ----

async function fetchCheckins(accessToken: string): Promise<FoursquareCheckin[]> {
    const params = new URLSearchParams({
        oauth_token: accessToken,
        v: FOURSQUARE_API_VERSION,
        limit: String(FETCH_LIMIT),
        sort: "newestfirst",
    });

    const response = await fetchWithTimeout(
        `https://api.foursquare.com/v2/users/self/checkins?${params.toString()}`,
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Foursquare API error: ${response.status} ${errText}`);
    }

    const data = (await response.json()) as CheckinsResponse;
    return data.response?.checkins?.items ?? [];
}

// ---- Privacy Filter ----

function applyPrivacyFilter(
    checkins: FoursquareCheckin[],
    blockedVenueIds: Set<string>,
): SwarmCheckinEntry[] {
    const cutoffMs = Date.now() - PRIVACY_DELAY_MS;
    const result: SwarmCheckinEntry[] = [];

    for (const c of checkins) {
        if (!c.venue) continue;

        const createdMs = c.createdAt * 1000;
        if (createdMs > cutoffMs) continue; // 24h ディレイ

        if (blockedVenueIds.has(c.venue.id)) continue; // venue blocklist

        const categoryName = c.venue.categories?.[0]?.name;
        if (categoryName && BLOCKED_CATEGORY_NAMES.has(categoryName)) continue;

        result.push({
            id: c.id,
            date: new Date(createdMs).toISOString(),
            venueName: c.venue.name,
            venueCategory: categoryName,
            city: c.venue.location?.city,
            lat: roundCoord(c.venue.location?.lat),
            lng: roundCoord(c.venue.location?.lng),
            shout: c.shout,
            url: `https://www.swarmapp.com/c/${c.id}`,
        });
    }

    return result;
}

// ---- Main ----

async function main() {
    const accessToken = getEnvVar("FOURSQUARE_ACCESS_TOKEN");
    const blockedVenueIds = new Set(
        (process.env.SWARM_BLOCKED_VENUE_IDS ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
    );

    console.log("Fetching Swarm checkins...");
    const apiCheckins = await fetchCheckins(accessToken);
    console.log(`Fetched ${apiCheckins.length} checkins from Foursquare`);

    const filtered = applyPrivacyFilter(apiCheckins, blockedVenueIds);
    console.log(`After privacy filter: ${filtered.length} checkins`);

    const existing = loadExisting();
    const entryMap = new Map<string, SwarmCheckinEntry>();
    for (const e of existing.checkins) entryMap.set(e.id, e);
    for (const e of filtered) entryMap.set(e.id, e);

    const merged = Array.from(entryMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const newCount = Math.max(0, merged.length - existing.checkins.length);

    const output: SwarmCheckinsFile = {
        lastUpdated: new Date().toISOString(),
        checkins: merged,
    };

    fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2) + "\n");
    console.log(`Saved ${merged.length} checkins to ${JSON_PATH}`);
    console.log(newCount > 0 ? `Added ${newCount} new checkins` : "No new checkins");

    await notifyIfNoteworthy({
        source: "Swarm",
        status: "success",
        newItems: newCount,
        metrics: [
            { name: "New Checkins", value: newCount },
            { name: "Total Checkins", value: merged.length },
            { name: "Filtered Out", value: apiCheckins.length - filtered.length },
        ],
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await notifyIfNoteworthy({
        source: "Swarm",
        status: "error",
        newItems: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
