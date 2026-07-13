/**
 * Swarm Checkin 追記スクリプト（IFTTT 経由）
 *
 * IFTTT が新しいチェックインを検知 → GitHub repository_dispatch を発火 →
 * このスクリプトが workflow から呼ばれて 1 件分の checkin を JSON に追記する。
 *
 * 必要な環境変数:
 *   SWARM_PAYLOAD            - JSON.stringify(client_payload)
 *   SWARM_BLOCKED_VENUES     - JSON 配列（ユーザー定義 blocklist）
 *   SWARM_MIGRATE_ONLY       - "1" なら payload を読まず既存エントリの正規化だけ実行
 *   DISCORD_WEBHOOK_URL      - 通知用（オプション）
 *
 * 動作:
 *   1. payload を parse
 *   2. ビルトイン blocklist（鉄道駅）+ ユーザー定義 blocklist を照合 → match なら exit 0
 *   3. 座標丸め・with除去・dedup・date を JST 暦日に丸め
 *   4. public/data/swarm-checkins.json に追記
 *   5. Discord 通知（venue 名・住所・blocklist コマンド付き）
 */

import * as crypto from "crypto";

import { notifyIfNoteworthy } from "./lib/discord-notification";
import { readFeed, writeFeed } from "./lib/feed-storage";

const FEED_FILE = "swarm-checkins.json";
const COORD_PRECISION = 1000; // 小数 3 桁（約 100m）
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// ---- ビルトイン blocklist ----

const BUILTIN_BLOCKED_CATEGORIES = new Set<string>([
    // 鉄道駅
    "Train Station",
    "Subway",
    "Metro Station",
    "Light Rail Station",
    "Tram Station",
    "Platform",
    "Train",
    // 医療
    "Hospital",
    "Doctor's Office",
    "Medical Center",
    "Dental Office",
    "Dentist's Office",
    "Mental Health Service",
    "Acupuncturist",
    "Chiropractor",
    "Optometrist",
    "Pharmacy",
    // 宗教
    "Buddhist Temple",
    "Shinto Shrine",
    "Church",
    "Mosque",
    "Synagogue",
    "Cathedral",
    "Hindu Temple",
    "Religious Center",
    // 宿泊
    "Hotel",
    "Motel",
    "Inn",
    "Hostel",
    "Bed & Breakfast",
    "Resort",
    // 葬祭
    "Funeral Home",
    "Cemetery",
    "Crematorium",
]);

// 鉄道駅: バイリンガル表記 "English Station (日本語駅)" もキャッチするため末尾の `)` を許容。
// 例: "Ōsaka Station (大阪駅)" / "JR-Shuntokumichi Station (JR俊徳道駅)" / "東京駅" / "Tokyo Station"
// "chocoZAP 俊徳道駅前" のような 駅前/駅ビル は末尾が 駅/Station ではないので素通り。
const RAIL_NAME_PATTERN = /(駅|Station)\s*\)?\s*$/i;

// 機微カテゴリの名前ベース照合。IFTTT は venueCategory を提供しないため、
// venue 名に含まれる業種キーワードで block する。過剰検知の方が公開漏洩より安全。
const SENSITIVE_NAME_PATTERNS: { pattern: RegExp; reason: string }[] = [
    {
        pattern: /(?:病院|医院|クリニック|診療所|歯科|内科|外科|小児科|婦人科|眼科|皮膚科|整形外科|耳鼻(?:咽喉)?科|心療内科|精神科|薬局|Hospital|Clinic|Medical\s*Center|\bDental\b|Dentist|Pharmacy)/i,
        reason: "medical/pharmacy",
    },
    {
        pattern: /(?:神社|神宮|大社|寺院|教会|モスク|聖堂|Shrine|\bTemple\b|\bChurch\b|Mosque|Synagogue|Cathedral)/i,
        reason: "religious site",
    },
    {
        // 単体「寺」は接尾辞として末尾／空白／括弧前に限定（寺町など街区名の誤検知回避）
        pattern: /[一-龯ぁ-んァ-ヴー]+寺(?:院)?(?:\s|$|\(|（)/u,
        reason: "Buddhist temple",
    },
    {
        pattern: /(?:ホテル|ホステル|旅館|民宿|ゲストハウス|Hotel|Motel|Hostel|Ryokan|\bInn\b|\bLodge\b)/i,
        reason: "lodging",
    },
    {
        pattern: /(?:葬儀|葬祭|斎場|霊園|墓地|Funeral|Cemetery|Memorial\s*Park)/i,
        reason: "funeral/cemetery",
    },
];

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
 * 観測された VenueMapImageUrl のフォーマット:
 *   IFTTT: https://ifttt.com/map_image?lng=135.57&lat=34.65&zoom=18&...     (lat/lng が別パラメータ)
 *   Google Maps Static API: ...?center=35.689,139.700&...                    (lat,lng カンマ区切り)
 *   Foursquare 旧 API: ?ll=35.689,139.700&...                                (lat,lng カンマ区切り)
 */
function extractCoordsFromMapUrl(mapUrl: string | undefined): { lat?: number; lng?: number } {
    if (!mapUrl) return {};

    // 1. lat=NUM, lng=NUM が別々にあるケース（IFTTT の map_image エンドポイント）
    const latMatch = mapUrl.match(/[?&]lat=(-?\d+\.?\d*)/i);
    const lngMatch = mapUrl.match(/[?&]lng=(-?\d+\.?\d*)/i);
    if (latMatch && lngMatch) {
        const lat = parseFloat(latMatch[1]);
        const lng = parseFloat(lngMatch[1]);
        if (isPlausibleCoord(lat, lng)) return { lat, lng };
    }

    // 2. ll= / center= / markers= パラメータに lat,lng がカンマ区切り（Google/Foursquare 静的地図）
    const named = mapUrl.match(/(?:ll|center|location|markers)=(-?\d+\.\d+),(-?\d+\.\d+)/i);
    if (named) {
        const lat = parseFloat(named[1]);
        const lng = parseFloat(named[2]);
        if (isPlausibleCoord(lat, lng)) return { lat, lng };
    }

    // 3. フォールバック: URL 中の最初の "数字.数字,数字.数字" パターン
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
    for (const { pattern, reason } of SENSITIVE_NAME_PATTERNS) {
        if (pattern.test(name)) {
            return `sensitive: ${reason}`;
        }
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

async function loadExisting(): Promise<SwarmCheckinsFile> {
    const data = await readFeed<SwarmCheckinsFile>(FEED_FILE, { lastUpdated: "", checkins: [] });
    return {
        lastUpdated: data.lastUpdated ?? "",
        checkins: data.checkins ?? [],
    };
}

/**
 * Deterministic dedup ID from venue + 丸め後の日付。
 * IFTTT が提供する VenueUrl は venue ページ URL（checkin permalink ではない）ので id には使えない。
 * 入力に正確な時刻を含めると、venue 名と日付が公開されている以上 1 日分のミリ秒を総当たりして
 * ハッシュから時刻を復元できてしまうため、丸め後の日付だけを材料にする。
 * 同じ venue に同じ日に複数回チェックインした場合は uniqueId() が連番を付ける。
 */
function deriveId(venueName: string, coarseDate: string): string {
    const hash = crypto.createHash("sha1").update(`${venueName}|${coarseDate}`).digest("hex");
    return hash.slice(0, 12);
}

function uniqueId(base: string, used: Set<string>): string {
    if (!used.has(base)) return base;
    for (let n = 2; ; n++) {
        const candidate = `${base}-${n}`;
        if (!used.has(candidate)) return candidate;
    }
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

/**
 * プライバシー: チェックインの時刻は公開しない。JST の暦日に丸め、その日の 12:00 JST
 * (= 03:00 UTC) に固定する。JSON も id もこの丸め後の値しか持たない。
 * 12:00 に寄せるのは、閲覧側のローカルタイムゾーンが多少ずれても日付が変わらないようにするため。
 */
function toCoarseDate(iso: string): string {
    const jst = new Date(new Date(iso).getTime() + JST_OFFSET_MS);
    return new Date(
        Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate(), 3, 0, 0),
    ).toISOString();
}

/**
 * 既存エントリを現行フォーマット（日付丸め済み・時刻を含まない id）に揃える。
 * 冪等なので毎回の書き込みで通しても no-op。SWARM_MIGRATE_ONLY=1 での一括移行にも使う。
 */
function normalizeExisting(entries: SwarmCheckinEntry[]): SwarmCheckinEntry[] {
    const used = new Set<string>();
    return entries.map((entry) => {
        const date = toCoarseDate(entry.date);
        const id = uniqueId(deriveId(entry.venueName, date), used);
        used.add(id);
        // checkinUrl 欠落時のフォールバック URL は旧 id を埋め込んでいるので貼り直す
        const url = entry.url === `https://www.swarmapp.com/c/${entry.id}`
            ? `https://www.swarmapp.com/c/${id}`
            : entry.url;
        return { ...entry, id, date, url };
    });
}

// ---- メイン ----

/** 既存 JSON を正規化して書き戻すだけのモード（新規エントリなし） */
async function migrateOnly() {
    const existing = await loadExisting();
    const normalized = normalizeExisting(existing.checkins);
    const merged = normalized.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    await writeFeed(FEED_FILE, { lastUpdated: new Date().toISOString(), checkins: merged });
    console.log(`Normalized ${merged.length} checkins (dates coarsened to JST calendar day)`);
}

async function main() {
    if (process.env.SWARM_MIGRATE_ONLY === "1") {
        await migrateOnly();
        return;
    }

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

    // 3. 既存 JSON を読み込み（同時に旧フォーマットのエントリを正規化）
    const existing = await loadExisting();
    const normalized = normalizeExisting(existing.checkins);
    const used = new Set(normalized.map((e) => e.id));

    // 4. SwarmCheckinEntry に整形。時刻は JST 暦日に丸めてから保存する
    const date = toCoarseDate(toIsoDate(payload.createdAt));
    const id = uniqueId(deriveId(venueName, date), used);
    const entry: SwarmCheckinEntry = {
        id,
        date,
        venueName,
        venueCategory,
        city: address,
        lat: roundCoord(rawLat),
        lng: roundCoord(rawLng),
        shout,
        url: payload.checkinUrl ?? `https://www.swarmapp.com/c/${id}`,
    };

    // 5. append。同日のエントリは同時刻になるので、安定ソートで新しいものが先頭に来るよう先に置く
    const merged = [entry, ...normalized].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const output: SwarmCheckinsFile = {
        lastUpdated: new Date().toISOString(),
        checkins: merged,
    };

    await writeFeed(FEED_FILE, output);
    console.log(`Added checkin: ${venueName} (id=${id})`);

    await notifyIfNoteworthy({
        source: "Swarm",
        status: "success",
        newItems: 1,
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
