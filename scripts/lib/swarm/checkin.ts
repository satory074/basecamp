/**
 * Swarm checkin の共通ロジック（IFTTT payload → 公開 JSON エントリ）。
 *
 * エントリポイントは 2 つあり、どちらも appendCheckins() を通す:
 *   - scripts/sync-swarm-sheet.ts    cron。IFTTT Free (Foursquare → Google Sheets) が溜めた行を排出
 *   - scripts/append-swarm-checkin.ts workflow_dispatch / repository_dispatch。手動 payload と migrate_only
 * blocklist・座標丸め・日付丸め・id 生成をここ 1 箇所に置き、2 経路で結果が食い違わないようにする。
 */

import * as crypto from "crypto";

import { notifyIfNoteworthy } from "../discord-notification";
import { readFeed, writeFeed } from "../feed-storage";

export const FEED_FILE = "swarm-checkins.json";
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

export interface IftttPayload {
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

export type BlocklistEntry =
    | { type: "name"; value: string }
    | { type: "address"; value: string }
    | { type: "category"; value: string }
    | { type: "lat-lng"; lat: number; lng: number; radiusM: number };

export interface SwarmCheckinEntry {
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

export interface SwarmCheckinsFile {
    lastUpdated: string;
    checkins: SwarmCheckinEntry[];
}

/** GCS 読み書きの差し替え口。テストで GCS を触らないためだけにある */
export interface FeedIO {
    readFeed: <T>(filename: string, fallback?: T) => Promise<T>;
    writeFeed: (filename: string, data: unknown) => Promise<void>;
}

const defaultIO: FeedIO = { readFeed, writeFeed };

// ---- ヘルパー ----

export function parseUserBlocklist(): BlocklistEntry[] {
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
export function extractCoordsFromMapUrl(mapUrl: string | undefined): { lat?: number; lng?: number } {
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

export function isBuiltinBlocked(name: string, category?: string): string | null {
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

export function isUserBlocked(
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

export async function loadExisting(io: FeedIO = defaultIO): Promise<SwarmCheckinsFile> {
    const data = await io.readFeed<SwarmCheckinsFile>(FEED_FILE, { lastUpdated: "", checkins: [] });
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
export function deriveId(venueName: string, coarseDate: string): string {
    const hash = crypto.createHash("sha1").update(`${venueName}|${coarseDate}`).digest("hex");
    return hash.slice(0, 12);
}

export function uniqueId(base: string, used: ReadonlySet<string>): string {
    if (!used.has(base)) return base;
    for (let n = 2; ; n++) {
        const candidate = `${base}-${n}`;
        if (!used.has(candidate)) return candidate;
    }
}

// IFTTT の {{CheckinDate}} は "April 29, 2026 at 02:34PM"（アカウントのタイムゾーン = JST、AM/PM の前に空白なし）。
// V8 の Date パーサはこの形式を Invalid Date にするので自前で読む。TZ 環境変数に依存しないよう JST 固定で計算する。
const IFTTT_DATE_PATTERN = /^([A-Za-z]+)\.? (\d{1,2}), (\d{4}) at (\d{1,2}):(\d{2})\s?(AM|PM)$/i;
const MONTH_PREFIXES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function parseIftttDate(input: string): string | undefined {
    const m = input.trim().match(IFTTT_DATE_PATTERN);
    if (!m) return undefined;
    const month = MONTH_PREFIXES.indexOf(m[1].slice(0, 3).toLowerCase());
    if (month < 0) return undefined;
    let hour = parseInt(m[4], 10) % 12;
    if (m[6].toUpperCase() === "PM") hour += 12;
    const utcHour = hour - 9; // JST → UTC（負の値は Date.UTC が前日に繰り下げる）
    return new Date(Date.UTC(parseInt(m[3], 10), month, parseInt(m[2], 10), utcHour, parseInt(m[5], 10))).toISOString();
}

export function toIsoDate(input: string | undefined): string {
    if (!input) {
        console.warn("createdAt is empty, falling back to now");
        return new Date().toISOString();
    }
    const ifttt = parseIftttDate(input);
    if (ifttt) return ifttt;
    const d = new Date(input);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    console.warn(`Unparseable createdAt "${input}", falling back to now`);
    return new Date().toISOString();
}

/**
 * プライバシー: チェックインの時刻は公開しない。JST の暦日に丸め、その日の 12:00 JST
 * (= 03:00 UTC) に固定する。JSON も id もこの丸め後の値しか持たない。
 * 12:00 に寄せるのは、閲覧側のローカルタイムゾーンが多少ずれても日付が変わらないようにするため。
 */
export function toCoarseDate(iso: string): string {
    const jst = new Date(new Date(iso).getTime() + JST_OFFSET_MS);
    return new Date(
        Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate(), 3, 0, 0),
    ).toISOString();
}

/**
 * 既存エントリを現行フォーマット（日付丸め済み・時刻を含まない id）に揃える。
 * 冪等なので毎回の書き込みで通しても no-op。SWARM_MIGRATE_ONLY=1 での一括移行にも使う。
 */
export function normalizeExisting(entries: SwarmCheckinEntry[]): SwarmCheckinEntry[] {
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

export function sortByDateDesc(entries: SwarmCheckinEntry[]): SwarmCheckinEntry[] {
    return [...entries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
}

// ---- Sheet 行 → payload ----

/**
 * Google Sheets inbox の 1 行を payload に変換する。列順は IFTTT applet の Formatted row と同じ:
 *   A CheckinDate | B VenueName | C VenueUrl | D VenueMapImageUrl | E Shout
 * Sheets API は末尾の空セルを省くので行が 5 列に満たないことがある。shout に区切り文字 `|||` が
 * 含まれていると IFTTT 側で列が増えるので、E 列以降は全部 shout として連結する。
 * 全セル空の行（手で消した跡）は undefined を返し、呼び出し側で読み飛ばす。
 */
export function rowToPayload(cells: readonly string[]): IftttPayload | undefined {
    const cell = (i: number): string | undefined => {
        const v = cells[i];
        if (typeof v !== "string") return undefined;
        return v.trim() || undefined;
    };
    if (cells.every((v) => typeof v !== "string" || v.trim() === "")) return undefined;
    const shout = cells.slice(4).map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean).join(" ");
    return {
        createdAt: cell(0),
        venueName: cell(1),
        checkinUrl: cell(2),
        mapImageUrl: cell(3),
        shout: shout || undefined,
    };
}

export function rowsToPayloads(rows: readonly (readonly string[])[]): IftttPayload[] {
    return rows.map(rowToPayload).filter((p): p is IftttPayload => p !== undefined);
}

// ---- 1 件の変換 ----

export type PreparedCheckin =
    | { kind: "entry"; entry: SwarmCheckinEntry }
    | { kind: "skipped"; venueName: string; reason: string };

/**
 * payload 1 件を公開エントリに変換する（純粋関数。`used` は id 衝突回避用で、呼び出し側が追加する）。
 * blocklist に当たると `skipped`（reason は `builtin:` / `user:`）。venue 名が無い壊れた行は `invalid:`。
 */
export function prepareCheckin(
    payload: IftttPayload,
    used: ReadonlySet<string>,
    blocklist: BlocklistEntry[],
): PreparedCheckin {
    const venueName = (payload.venueName ?? "").trim();
    if (!venueName) {
        return { kind: "skipped", venueName: "(no venue)", reason: "invalid: venueName is empty" };
    }

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

    const builtinReason = isBuiltinBlocked(venueName, venueCategory);
    if (builtinReason) {
        return { kind: "skipped", venueName, reason: `builtin: ${builtinReason}` };
    }
    const userReason = isUserBlocked(venueName, address, venueCategory, rawLat, rawLng, blocklist);
    if (userReason) {
        return { kind: "skipped", venueName, reason: `user: ${userReason}` };
    }

    // 時刻は JST 暦日に丸めてから保存する
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
        url: payload.checkinUrl?.trim() || `https://www.swarmapp.com/c/${id}`,
    };
    return { kind: "entry", entry };
}

// ---- バッチ追記 ----

export interface AppendResult {
    added: SwarmCheckinEntry[];
    skipped: { venueName: string; reason: string }[];
    /** 書き込み後の総件数（書かなかった run では既存件数、0 件入力なら 0） */
    total: number;
    wrote: boolean;
}

/**
 * payload を古い順に受け取り、1 回の read-modify-write で GCS に追記する。
 * 0 件なら GCS を読まない。全件 blocklist なら書かない（旧 1 件経路と同じ挙動）。
 */
export async function appendCheckins(
    payloads: IftttPayload[],
    blocklist: BlocklistEntry[],
    io: FeedIO = defaultIO,
): Promise<AppendResult> {
    if (payloads.length === 0) {
        return { added: [], skipped: [], total: 0, wrote: false };
    }

    // 既存 JSON を読み込み（同時に旧フォーマットのエントリを正規化）
    const existing = await loadExisting(io);
    const normalized = normalizeExisting(existing.checkins);
    const used = new Set(normalized.map((e) => e.id));

    const added: SwarmCheckinEntry[] = [];
    const skipped: AppendResult["skipped"] = [];
    for (const payload of payloads) {
        const prepared = prepareCheckin(payload, used, blocklist);
        if (prepared.kind === "skipped") {
            console.log(`Skipped (${prepared.reason}): ${prepared.venueName}`);
            skipped.push({ venueName: prepared.venueName, reason: prepared.reason });
            continue;
        }
        used.add(prepared.entry.id);
        added.push(prepared.entry);
        console.log(`Added checkin: ${prepared.entry.venueName} (id=${prepared.entry.id})`);
    }

    if (added.length === 0) {
        return { added, skipped, total: normalized.length, wrote: false };
    }

    // 同日のエントリは同時刻になるので、安定ソートで新しいものが先頭に来るよう新規分を（新しい順で）先に置く
    const merged = sortByDateDesc([...added].reverse().concat(normalized));
    const output: SwarmCheckinsFile = {
        lastUpdated: new Date().toISOString(),
        checkins: merged,
    };
    await io.writeFeed(FEED_FILE, output);
    return { added, skipped, total: merged.length, wrote: true };
}

/**
 * run につき Discord 1 通。追加 0 件で blocklist スキップだけの run は notifyIfNoteworthy が黙らせる。
 * 壊れた行（`invalid:`）や Sheet 行削除の失敗は warning として必ず送る。
 */
export async function notifySwarmResult(
    result: AppendResult,
    extra: { rowsDeleted?: number; errors?: string[] } = {},
): Promise<void> {
    const invalid = result.skipped.filter((s) => s.reason.startsWith("invalid:"));
    const errors = [
        ...(extra.errors ?? []),
        ...invalid.map((s) => `${s.venueName}: ${s.reason}`),
    ];

    const lines: string[] = result.added.map((e) => `${e.venueName}${e.city ? ` (${e.city})` : ""}`);
    const blocked = result.skipped.filter((s) => !s.reason.startsWith("invalid:"));
    if (blocked.length > 0) {
        lines.push("", ...blocked.map((s) => `スキップ: ${s.venueName} (${s.reason})`));
    }
    if (result.added.length > 0) {
        const example = result.added.length === 1 ? result.added[0].venueName : "<venue>";
        lines.push("", `ブロックする場合: \`npx tsx scripts/swarm-blocklist.ts add name "${example}"\``);
    }

    const metrics: { name: string; value: string | number }[] = [
        { name: "Added", value: result.added.length },
        { name: "Skipped", value: result.skipped.length },
        { name: "Total", value: result.total },
    ];
    if (extra.rowsDeleted !== undefined) {
        metrics.push({ name: "Sheet rows deleted", value: extra.rowsDeleted });
    }

    await notifyIfNoteworthy({
        source: "Swarm",
        status: errors.length > 0 ? "warning" : "success",
        newItems: result.added.length,
        summary: lines.length > 0 ? lines.join("\n") : undefined,
        metrics,
        errors: errors.length > 0 ? errors : undefined,
    });
}
