/**
 * alco-diary 飲酒記録の取り込みスクリプト
 *
 * alco-diary (Vercel) の /api/publish → GitHub repository_dispatch (alco-diary-sync) →
 * このスクリプトが workflow から呼ばれて gs://basecamp-feeds/alco-drinks.json を更新する。
 *
 * 必要な環境変数:
 *   ALCO_PAYLOAD         - JSON.stringify(client_payload)
 *   DISCORD_WEBHOOK_URL  - 通知用（オプション）
 *
 * 動作:
 *   1. payload を parse・検証
 *   2. payload に含まれる dayKey は既存レコードを丸ごと差し替える（upsert）
 *      → アプリ側で消した記録・修正した記録がサイトにも反映される。
 *        items: [] は「その日は記録なし（休肝日）」を意味する
 *   3. date は dayKey の 12:00 JST に固定（正確な飲酒時刻は公開しない）
 *   4. 保持期間 MAX_DAYS を超えた古い日を切り捨て（切った件数はログに出す）
 *   5. Discord 通知（銘柄名は載せず件数のみ）
 */

import { notifyIfNoteworthy } from "./lib/discord-notification";
import { readFeed, writeFeed } from "./lib/feed-storage";

const FEED_FILE = "alco-drinks.json";
const MAX_DAYS = 400;
const JST_NOON_UTC_HOUR = 3; // 12:00 JST = 03:00 UTC

// ---- 型 ----

interface PayloadItem {
    id: string;
    name: string;
    volumeMl: number;
    abv: number;
    alcoholG: number;
    kcal?: number;
}

interface PayloadDay {
    dayKey: string;
    items: PayloadItem[];
}

interface AlcoPayload {
    v: number;
    days: PayloadDay[];
}

interface AlcoDay {
    dayKey: string;
    /** dayKey の 12:00 JST を ISO で固定したもの */
    date: string;
    totalG: number;
    count: number;
    items: PayloadItem[];
}

interface AlcoFile {
    lastUpdated: string;
    days: AlcoDay[];
}

// ---- 検証 ----

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const ITEM_ID_RE = /^[0-9a-f]{12}(-\d+)?$/;

function isFiniteNumber(v: unknown): v is number {
    return typeof v === "number" && Number.isFinite(v);
}

function parseItem(raw: unknown, where: string): PayloadItem {
    if (typeof raw !== "object" || raw === null) throw new Error(`${where}: item is not an object`);
    const o = raw as Record<string, unknown>;
    if (typeof o.id !== "string" || !ITEM_ID_RE.test(o.id)) throw new Error(`${where}: invalid id`);
    if (typeof o.name !== "string" || o.name === "" || o.name.length > 200) {
        throw new Error(`${where}: invalid name`);
    }
    if (!isFiniteNumber(o.volumeMl) || !isFiniteNumber(o.abv) || !isFiniteNumber(o.alcoholG)) {
        throw new Error(`${where}: invalid numbers`);
    }
    if (o.kcal !== undefined && !isFiniteNumber(o.kcal)) throw new Error(`${where}: invalid kcal`);
    return {
        id: o.id,
        name: o.name,
        volumeMl: o.volumeMl,
        abv: o.abv,
        alcoholG: o.alcoholG,
        ...(o.kcal === undefined ? {} : { kcal: o.kcal }),
    };
}

function parsePayload(): AlcoPayload {
    const raw = process.env.ALCO_PAYLOAD;
    if (!raw) throw new Error("ALCO_PAYLOAD is not set");
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        throw new Error(`Invalid ALCO_PAYLOAD JSON: ${(err as Error).message}`);
    }
    if (typeof parsed !== "object" || parsed === null) throw new Error("payload is not an object");
    const o = parsed as Record<string, unknown>;
    if (o.v !== 1) throw new Error(`unsupported payload version: ${String(o.v)}`);
    if (!Array.isArray(o.days)) throw new Error("payload.days is not an array");

    const days: PayloadDay[] = o.days.map((d, i) => {
        if (typeof d !== "object" || d === null) throw new Error(`days[${i}] is not an object`);
        const dd = d as Record<string, unknown>;
        if (typeof dd.dayKey !== "string" || !DAY_KEY_RE.test(dd.dayKey)) {
            throw new Error(`days[${i}]: invalid dayKey`);
        }
        if (!Array.isArray(dd.items)) throw new Error(`days[${i}]: items is not an array`);
        return {
            dayKey: dd.dayKey,
            items: dd.items.map((it, j) => parseItem(it, `days[${i}].items[${j}]`)),
        };
    });

    return { v: 1, days };
}

// ---- 変換 ----

/**
 * dayKey を「その日の 12:00 JST (= 03:00 UTC)」の ISO 文字列にする。
 * 正確な飲酒時刻は公開しない。12:00 に寄せるのは、閲覧側のタイムゾーンが
 * 多少ずれても日付が変わらないようにするため（Swarm チェックインと同じ方針）。
 */
function toCoarseDate(dayKey: string): string {
    const [y, m, d] = dayKey.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, JST_NOON_UTC_HOUR, 0, 0)).toISOString();
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function toAlcoDay(day: PayloadDay): AlcoDay {
    return {
        dayKey: day.dayKey,
        date: toCoarseDate(day.dayKey),
        totalG: round1(day.items.reduce((sum, i) => sum + i.alcoholG, 0)),
        count: day.items.length,
        items: day.items,
    };
}

async function loadExisting(): Promise<AlcoFile> {
    const data = await readFeed<AlcoFile>(FEED_FILE, { lastUpdated: "", days: [] });
    return { lastUpdated: data.lastUpdated ?? "", days: data.days ?? [] };
}

// ---- メイン ----

async function main() {
    const payload = parsePayload();
    const existing = await loadExisting();

    // payload に含まれる dayKey は丸ごと差し替え、含まれない日はそのまま残す
    const incoming = new Map(payload.days.map((d) => [d.dayKey, toAlcoDay(d)]));
    const kept = existing.days.filter((d) => !incoming.has(d.dayKey));
    const merged = [...incoming.values(), ...kept].sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1));

    const dropped = Math.max(0, merged.length - MAX_DAYS);
    if (dropped > 0) {
        console.log(`Dropped ${dropped} day(s) older than the ${MAX_DAYS}-day retention window`);
    }
    const days = merged.slice(0, MAX_DAYS);

    await writeFeed(FEED_FILE, { lastUpdated: new Date().toISOString(), days } satisfies AlcoFile);

    const newItems = payload.days.reduce((n, d) => n + d.items.length, 0);
    const restDays = payload.days.filter((d) => d.items.length === 0).length;
    console.log(
        `Synced ${payload.days.length} day(s), ${newItems} item(s); feed now holds ${days.length} day(s)`,
    );

    // 銘柄名は通知に載せない（件数のみ）
    await notifyIfNoteworthy({
        source: "alco-diary",
        status: "success",
        newItems,
        metrics: [
            { name: "Synced days", value: payload.days.length },
            { name: "Items", value: newItems },
            { name: "Rest days", value: restDays },
            { name: "Total days", value: days.length },
        ],
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await notifyIfNoteworthy({
        source: "alco-diary",
        status: "error",
        newItems: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
