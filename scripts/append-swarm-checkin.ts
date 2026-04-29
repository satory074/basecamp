/**
 * Swarm Checkin 追記スクリプト（IFTTT 経由）
 *
 * IFTTT が新しいチェックインを検知 → GitHub repository_dispatch を発火 →
 * このスクリプトが workflow から呼ばれて 1 件分の checkin を JSON に追記する。
 *
 * 必要な環境変数:
 *   SWARM_PAYLOAD            - JSON.stringify(client_payload)
 *   SWARM_BLOCKED_VENUES     - JSON 配列（ユーザー定義 blocklist）
 *   DISCORD_WEBHOOK_URL      - 通知用（オプション）
 *
 * 動作:
 *   1. payload を parse
 *   2. ビルトイン blocklist（鉄道駅）+ ユーザー定義 blocklist を照合 → match なら exit 0
 *   3. 座標丸め・with除去・dedup・date ISO 化
 *   4. public/data/swarm-checkins.json に追記
 *   5. Discord 通知（venue 名・住所・blocklist コマンド付き）
 */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

import { notifyIfNoteworthy } from "./lib/discord-notification";

const JSON_PATH = path.join(process.cwd(), "public/data/swarm-checkins.json");
const COORD_PRECISION = 1000; // 小数 3 桁（約 100m）

// ---- ビルトイン blocklist: 鉄道駅 ----

const BUILTIN_BLOCKED_CATEGORIES = new Set<string>([
    "Train Station",
    "Subway",
    "Metro Station",
    "Light Rail Station",
    "Tram Station",
    "Platform",
    "Train",
]);

const RAIL_NAME_PATTERN = /(駅|Station)\s*$/i;

// ---- 型 ----

interface IftttPayload {
    checkinUrl?: string;       // IFTTT: {{VenueUrl}} (venue page link, used as checkin URL)
    createdAt?: string;        // IFTTT: {{CheckinDate}}
    venueName?: string;        // IFTTT: {{VenueName}}
    venueCategory?: string;    // IFTTT does not provide; left undefined
    address?: string;          // IFTTT does not provide; left undefined
    lat?: string | number;     // IFTTT does not provide; extracted from mapImageUrl
    lng?: string | number;     // IFTTT does not provide; extracted from mapImageUrl
    shout?: string;            // IFTTT: {{Shout}}
    mapImageUrl?: string;      // IFTTT: {{VenueMapImageUrl}} — coords extracted from query string
}

type BlocklistEntry =
    | { type: "name"; value: string }
    | { type: "address"; value: string }
    | { type: "category"; value: string }
    | { type: "lat-lng"; lat: number; lng: number; radiusM: number };

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

// ---- ヘルパー ----

function parsePayload(): IftttPayload {
    const raw = process.env.SWARM_PAYLOAD;
    if (!raw) throw new Error("SWARM_PAYLOAD is not set");
    try {
        return JSON.parse(raw) as IftttPayload;
    } catch (err) {
        throw new Error(`Invalid SWARM_PAYLOAD JSON: ${(err as Error).message}`);
    }
}

function parseUserBlocklist(): BlocklistEntry[] {
    const raw = process.env.SWARM_BLOCKED_VENUES;
    if (!raw || raw.trim() === "") return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as BlocklistEntry[]) : [];
    } catch {
        console.warn("Invalid SWARM_BLOCKED_VENUES JSON, ignoring");
        return [];
    }
}

function toNumber(v: string | number | undefined): number | undefined {
    if (v === undefined || v === null || v === "") return undefined;
    const n = typeof v === "number" ? v : parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
}

/**
 * Extract lat/lng from a static-map image URL.
 * Foursquare/Swarm の VenueMapImageUrl は典型的に以下のような URL:
 *   https://ss3.4sqi.net/img/static_map/...?ll=35.689,139.700&...
 *   https://api.foursquare.com/...?center=35.689,139.700&...
 *   https://maps.googleapis.com/maps/api/staticmap?center=35.689,139.700&...
 * いずれもクエリ文字列に "lat,lng" 形式の2連数値が含まれる。
 */
function extractCoordsFromMapUrl(mapUrl: string | undefined): { lat?: number; lng?: number } {
    if (!mapUrl) return {};
    // ll= or center= パラメータ優先で抽出
    const named = mapUrl.match(/(?:ll|center|location|markers)=(-?\d+\.\d+),(-?\d+\.\d+)/i);
    if (named) {
        const lat = parseFloat(named[1]);
        const lng = parseFloat(named[2]);
        if (isPlausibleCoord(lat, lng)) return { lat, lng };
    }
    // フォールバック: URL 中の最初の "数字.数字,数字.数字" パターン
    const generic = mapUrl.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (generic) {
        const lat = parseFloat(generic[1]);
        const lng = parseFloat(generic[2]);
        if (isPlausibleCoord(lat, lng)) return { lat, lng };
    }
    return {};
}

function isPlausibleCoord(lat: number, lng: number): boolean {
    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180 &&
        // 厳密に 0,0 だけの組み合わせは null island (誤検出) として除外
        !(lat === 0 && lng === 0)
    );
}

function roundCoord(v: number | undefined): number | undefined {
    if (v === undefined) return undefined;
    return Math.round(v * COORD_PRECISION) / COORD_PRECISION;
}

function normalizeName(s: string): string {
    return s.toLowerCase().replace(/\s+/g, "");
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

function isBuiltinBlocked(name: string, category?: string): string | null {
    if (category && BUILTIN_BLOCKED_CATEGORIES.has(category)) {
        return `category="${category}"`;
    }
    if (RAIL_NAME_PATTERN.test(name)) {
        return `name matches /駅|Station/`;
    }
    return null;
}

function isUserBlocked(
    name: string,
    address: string | undefined,
    category: string | undefined,
    lat: number | undefined,
    lng: number | undefined,
    blocklist: BlocklistEntry[],
): string | null {
    const nName = normalizeName(name);
    const nAddr = address ? normalizeName(address) : "";
    for (const entry of blocklist) {
        if (entry.type === "name" && nName.includes(normalizeName(entry.value))) {
            return `name match: "${entry.value}"`;
        }
        if (entry.type === "address" && nAddr && nAddr.includes(normalizeName(entry.value))) {
            return `address match: "${entry.value}"`;
        }
        if (entry.type === "category" && category === entry.value) {
            return `category match: "${entry.value}"`;
        }
        if (entry.type === "lat-lng" && lat !== undefined && lng !== undefined) {
            const dist = haversineMeters(lat, lng, entry.lat, entry.lng);
            if (dist <= entry.radiusM) {
                return `lat-lng within ${entry.radiusM}m of (${entry.lat}, ${entry.lng})`;
            }
        }
    }
    return null;
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

function extractIdFromUrl(checkinUrl: string | undefined): string | null {
    if (!checkinUrl) return null;
    const match = checkinUrl.match(/\/c\/([\w-]+)/);
    return match ? match[1] : null;
}

/**
 * Deterministic dedup ID from venue + timestamp.
 * IFTTT が提供する VenueUrl は venue ページ URL（checkin permalink ではない）なので、
 * 同じ venue で何度もチェックインすると VenueUrl は同じになる。
 * 一意化のために (venueName + createdAt) の SHA-1 を使う。
 */
function deriveId(venueName: string, createdAt: string): string {
    const hash = crypto.createHash("sha1").update(`${venueName}|${createdAt}`).digest("hex");
    return hash.slice(0, 12);
}

function toIsoDate(input: string | undefined): string {
    if (!input) return new Date().toISOString();
    const d = new Date(input);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    // IFTTT は "April 29, 2026 at 02:34PM" のような形式で送ることがある
    const fallback = new Date(input.replace(/\s+at\s+/, " "));
    if (!Number.isNaN(fallback.getTime())) return fallback.toISOString();
    return new Date().toISOString();
}

// ---- メイン ----

async function main() {
    const payload = parsePayload();
    const venueName = (payload.venueName ?? "").trim();
    if (!venueName) throw new Error("payload.venueName is empty");

    const venueCategory = payload.venueCategory?.trim() || undefined;
    const address = payload.address?.trim() || undefined;
    let rawLat = toNumber(payload.lat);
    let rawLng = toNumber(payload.lng);
    // IFTTT は lat/lng を直接提供しないので VenueMapImageUrl の center=... から抽出
    if (rawLat === undefined || rawLng === undefined) {
        const fromMap = extractCoordsFromMapUrl(payload.mapImageUrl);
        if (rawLat === undefined) rawLat = fromMap.lat;
        if (rawLng === undefined) rawLng = fromMap.lng;
    }
    const shout = payload.shout?.trim() || undefined;

    // 1. ビルトイン blocklist
    const builtinReason = isBuiltinBlocked(venueName, venueCategory);
    if (builtinReason) {
        console.log(`Skipped (builtin blocklist: ${builtinReason}): ${venueName}`);
        await notifyIfNoteworthy({
            source: "Swarm",
            status: "success",
            newItems: 0,
            metrics: [
                { name: "Skipped", value: venueName },
                { name: "Reason", value: `builtin: ${builtinReason}` },
            ],
        });
        return;
    }

    // 2. ユーザー定義 blocklist
    const userBlocklist = parseUserBlocklist();
    const userReason = isUserBlocked(venueName, address, venueCategory, rawLat, rawLng, userBlocklist);
    if (userReason) {
        console.log(`Skipped (user blocklist: ${userReason}): ${venueName}`);
        await notifyIfNoteworthy({
            source: "Swarm",
            status: "success",
            newItems: 0,
            metrics: [
                { name: "Skipped", value: venueName },
                { name: "Reason", value: `user: ${userReason}` },
            ],
        });
        return;
    }

    // 3. SwarmCheckinEntry に整形
    const isoDate = toIsoDate(payload.createdAt);
    // ID 優先順位: (a) URL から /c/<id> 抽出、(b) (venueName + createdAt) ハッシュ
    const id = extractIdFromUrl(payload.checkinUrl) ?? deriveId(venueName, isoDate);
    const entry: SwarmCheckinEntry = {
        id,
        date: isoDate,
        venueName,
        venueCategory,
        city: address,
        lat: roundCoord(rawLat),
        lng: roundCoord(rawLng),
        shout,
        url: payload.checkinUrl ?? `https://www.swarmapp.com/c/${id}`,
    };

    // 4. 既存 JSON を読み込み + dedup append
    const existing = loadExisting();
    const map = new Map<string, SwarmCheckinEntry>();
    for (const e of existing.checkins) map.set(e.id, e);
    const isNew = !map.has(entry.id);
    map.set(entry.id, entry);

    const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const output: SwarmCheckinsFile = {
        lastUpdated: new Date().toISOString(),
        checkins: merged,
    };

    fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2) + "\n");
    console.log(`${isNew ? "Added" : "Updated"} checkin: ${venueName} (id=${id})`);

    await notifyIfNoteworthy({
        source: "Swarm",
        status: "success",
        newItems: isNew ? 1 : 0,
        summary: `${venueName}${address ? ` (${address})` : ""}\n\nブロックする場合: \`npx tsx scripts/swarm-blocklist.ts add name "${venueName}"\``,
        metrics: [
            { name: "Venue", value: venueName },
            { name: "Total", value: merged.length },
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
