/**
 * Apple Health (HealthKit) フィード関連の共通型 + payload パーサ。
 *
 * 受信スキーマは Health Auto Export 公式フォーマットと互換:
 *   { "data": { "workouts": [ { id, name, start, end, duration, distance:{qty,units}, activeEnergyBurned:{qty,units} } ] } }
 *
 * iOS Shortcuts 自作でも、Health Auto Export アプリ ($5–10) でも、
 * 同じ shape で送ればこの parser が両方受け付ける。
 */

import * as crypto from "crypto";

// ---- 永続化形式 (gs://basecamp-feeds/applehealth-feed.json) ----

export interface AppleHealthWorkoutEntry {
    id: string;
    date: string;              // ISO 8601 (workout start)
    title: string;             // "5.2 km ランニング" 等
    description?: string;
    workoutType: string;       // HealthKit workout name (e.g. "Running")
    durationSeconds?: number;
    distanceKm?: number;
    kcal?: number;
    endDate?: string;          // workout end (ISO)
}

export interface AppleHealthFeed {
    lastUpdated: string;
    workouts: AppleHealthWorkoutEntry[];
}

// ---- 受信ペイロード (Health Auto Export shape) ----

interface IncomingQty {
    qty?: number;
    units?: string;
}

interface IncomingWorkout {
    id?: string;
    name?: string;
    start?: string;
    end?: string;
    duration?: number;
    distance?: IncomingQty | number;
    activeEnergyBurned?: IncomingQty | number;
    totalEnergyBurned?: IncomingQty | number;
}

interface IncomingPayload {
    data?: { workouts?: IncomingWorkout[] };
    workouts?: IncomingWorkout[];
}

// ---- ヘルパー ----

function pickQty(v: IncomingQty | number | undefined): number | undefined {
    if (v === undefined || v === null) return undefined;
    if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
    if (typeof v === "object" && typeof v.qty === "number" && Number.isFinite(v.qty)) return v.qty;
    return undefined;
}

function pickQtyWithUnits(v: IncomingQty | number | undefined): { qty?: number; units?: string } {
    if (v === undefined || v === null) return {};
    if (typeof v === "number") return { qty: Number.isFinite(v) ? v : undefined };
    if (typeof v === "object") {
        return {
            qty: typeof v.qty === "number" && Number.isFinite(v.qty) ? v.qty : undefined,
            units: typeof v.units === "string" ? v.units : undefined,
        };
    }
    return {};
}

function toIso(input: string | undefined): string | undefined {
    if (!input) return undefined;
    // Health Auto Export uses "yyyy-MM-dd HH:mm:ss Z" — Date can parse it.
    const d = new Date(input);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
    return undefined;
}

function deriveId(name: string, start: string): string {
    return "ah-" + crypto.createHash("sha1").update(`${name}|${start}`).digest("hex").slice(0, 12);
}

function workoutLabel(name: string): string {
    const n = name.toLowerCase();
    if (n.includes("run")) return "ランニング";
    if (n.includes("walk")) return "ウォーキング";
    if (n.includes("hik")) return "ハイキング";
    if (n.includes("cycl") || n.includes("bike")) return "サイクリング";
    if (n.includes("swim")) return "スイミング";
    if (n.includes("yoga")) return "ヨガ";
    if (n.includes("strength") || n.includes("functional")) return "筋トレ";
    if (n.includes("dance")) return "ダンス";
    return "ワークアウト";
}

function buildTitle(workoutType: string, distanceKm?: number, durationSeconds?: number): string {
    const label = workoutLabel(workoutType);
    if (typeof distanceKm === "number" && distanceKm >= 0.1) {
        return `${distanceKm.toFixed(2)} km ${label}`;
    }
    if (typeof durationSeconds === "number" && durationSeconds >= 60) {
        const min = Math.round(durationSeconds / 60);
        const formatted = min >= 60 ? `${Math.floor(min / 60)}h${min % 60}m` : `${min}分`;
        return `${formatted} ${label}`;
    }
    return label;
}

/**
 * 距離を km に正規化。"km", "mi", "m" を受ける (Health Auto Export は通常 "km" で送る)。
 */
function distanceToKm(qty: number | undefined, units: string | undefined): number | undefined {
    if (typeof qty !== "number") return undefined;
    if (!units) return qty;          // 単位なしは km と仮定
    const u = units.toLowerCase();
    if (u === "km") return qty;
    if (u === "mi" || u === "mile" || u === "miles") return qty * 1.609344;
    if (u === "m" || u === "meter" || u === "meters") return qty / 1000;
    return qty;                       // 未知単位はそのまま (誤変換よりマシ)
}

/**
 * Payload を AppleHealthWorkoutEntry[] に変換する。
 * 不正/不足のエントリはスキップし、有効なものだけ返す。
 */
export function parseHealthAutoExportPayload(input: unknown): AppleHealthWorkoutEntry[] {
    if (!input || typeof input !== "object") return [];
    const payload = input as IncomingPayload;
    const list = payload.data?.workouts ?? payload.workouts ?? [];
    if (!Array.isArray(list)) return [];

    const result: AppleHealthWorkoutEntry[] = [];
    for (const w of list) {
        const start = toIso(w.start);
        if (!start) continue;
        const name = (w.name ?? "").trim() || "Workout";

        const dist = pickQtyWithUnits(w.distance);
        const distanceKm = distanceToKm(dist.qty, dist.units);
        const kcal = pickQty(w.activeEnergyBurned) ?? pickQty(w.totalEnergyBurned);
        const durationSeconds = typeof w.duration === "number" && Number.isFinite(w.duration) ? w.duration : undefined;

        const id = (w.id && typeof w.id === "string" ? w.id : deriveId(name, start));

        result.push({
            id,
            date: start,
            endDate: toIso(w.end),
            title: buildTitle(name, distanceKm, durationSeconds),
            workoutType: name,
            durationSeconds,
            distanceKm: typeof distanceKm === "number" ? Math.round(distanceKm * 100) / 100 : undefined,
            kcal: typeof kcal === "number" ? Math.round(kcal) : undefined,
        });
    }
    return result;
}
