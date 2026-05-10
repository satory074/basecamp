/**
 * Apple Health (HealthKit) フィード関連の共通型 + payload パーサ。
 *
 * 受信スキーマは Health Auto Export 公式フォーマットと互換:
 *   {
 *     "data": {
 *       "workouts":     [ { id, name, start, end, duration, distance, activeEnergyBurned } ],
 *       "metrics":      [ { name: "step_count" | "apple_exercise_time" | "active_energy",
 *                           units, data: [ { qty, date } ] } ],
 *       "stateOfMind":  [ { id, start, end, kind, labels, associations, valence, valenceClassification } ]
 *     }
 *   }
 *
 * 設計方針:
 * - workouts: 1 セッション 1 entry (既存)
 * - metrics: 同日のサンプルを 1 entry に集約 (id="applehealth-daily-YYYY-MM-DD")
 *   HAE の "Summarize Data: Day" を使う前提だが、個別サンプルでも sum で安全に集約
 * - stateOfMind: 1 ログ 1 entry。associations (家族/仕事 etc) は永続化のみで UI には出さない
 */

import * as crypto from "crypto";

// ---- 永続化形式 (gs://basecamp-feeds/applehealth-feed.json) ----

export interface AppleHealthWorkoutEntry {
    id: string;
    date: string;              // ISO 8601 (workout start)
    title: string;
    description?: string;
    workoutType: string;
    durationSeconds?: number;
    distanceKm?: number;
    kcal?: number;
    endDate?: string;
}

export interface DailyActivityEntry {
    id: string;                // "applehealth-daily-YYYY-MM-DD"
    dayKey: string;            // "YYYY-MM-DD" (JST 日付)
    date: string;              // ISO 8601, dayKey の 23:50 JST に pin (フィード内ソート用)
    title: string;             // "今日のアクティビティ" 等
    steps?: number;
    exerciseMinutes?: number;
    activeKcal?: number;
}

export interface StateOfMindEntry {
    id: string;                // HAE が送る UUID、無ければ sha1(start|labels)
    date: string;              // ISO 8601 (start)
    title: string;             // labels[0] or labels.join(" · ")
    kind: string;              // "momentary" | "daily"
    valence?: number;
    valenceClassification?: number;
    labels: string[];
    associations?: string[];   // 永続化のみ。GET 時は post に載せない
}

export interface AppleHealthFeed {
    lastUpdated: string;
    workouts: AppleHealthWorkoutEntry[];
    dailyActivity: DailyActivityEntry[];
    stateOfMind: StateOfMindEntry[];
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

interface IncomingMetricSample {
    qty?: number;
    date?: string;
}

interface IncomingMetric {
    name?: string;
    units?: string;
    data?: IncomingMetricSample[];
}

interface IncomingStateOfMind {
    id?: string;
    start?: string;
    end?: string;
    kind?: string;
    labels?: string[];
    associations?: string[];
    valence?: number;
    valenceClassification?: number;
}

interface IncomingPayload {
    data?: {
        workouts?: IncomingWorkout[];
        metrics?: IncomingMetric[];
        stateOfMind?: IncomingStateOfMind[];
    };
    workouts?: IncomingWorkout[];
    metrics?: IncomingMetric[];
    stateOfMind?: IncomingStateOfMind[];

    // ----- フラット shape (iOS Shortcut から組みやすい簡易形式) -----
    // 例: { "steps": 9234, "exerciseMinutes": 47, "activeKcal": 412, "date": "2026-05-10" }
    // date 未指定時は今日 (JST) を使う
    steps?: number;
    exerciseMinutes?: number;
    activeKcal?: number;
    date?: string;
}

// ---- ヘルパー (共通) ----

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

/** YYYY-MM-DD を JST タイムゾーンの日付として返す (HAE は端末 TZ で日付を切るため JST 想定) */
function toJstDayKey(input: string | undefined): string | undefined {
    if (!input) return undefined;
    // 既に "YYYY-MM-DD" フォーマットならそのまま
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return undefined;
    // toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }) → "2026-05-10"
    return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

/** dayKey ("YYYY-MM-DD") から 23:50 JST の ISO 8601 を作る */
function dayKeyToPinnedIso(dayKey: string): string {
    return new Date(`${dayKey}T23:50:00+09:00`).toISOString();
}

// ---- ワークアウト ----

function deriveWorkoutId(name: string, start: string): string {
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

function buildWorkoutTitle(workoutType: string, distanceKm?: number, durationSeconds?: number): string {
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

function distanceToKm(qty: number | undefined, units: string | undefined): number | undefined {
    if (typeof qty !== "number") return undefined;
    if (!units) return qty;
    const u = units.toLowerCase();
    if (u === "km") return qty;
    if (u === "mi" || u === "mile" || u === "miles") return qty * 1.609344;
    if (u === "m" || u === "meter" || u === "meters") return qty / 1000;
    return qty;
}

export function parseWorkouts(input: IncomingPayload): AppleHealthWorkoutEntry[] {
    const list = input.data?.workouts ?? input.workouts ?? [];
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
        const id = (w.id && typeof w.id === "string" ? w.id : deriveWorkoutId(name, start));

        result.push({
            id,
            date: start,
            endDate: toIso(w.end),
            title: buildWorkoutTitle(name, distanceKm, durationSeconds),
            workoutType: name,
            durationSeconds,
            distanceKm: typeof distanceKm === "number" ? Math.round(distanceKm * 100) / 100 : undefined,
            kcal: typeof kcal === "number" ? Math.round(kcal) : undefined,
        });
    }
    return result;
}

// ---- 日次集約 (歩数・エクササイズ時間・アクティブカロリー) ----

/** HAE の metric.units を minutes に正規化 */
function timeToMinutes(qty: number, units: string | undefined): number {
    if (!units) return qty;
    const u = units.toLowerCase();
    if (u === "min" || u === "minutes" || u === "mins") return qty;
    if (u === "sec" || u === "seconds" || u === "s") return qty / 60;
    if (u === "hr" || u === "hour" || u === "hours" || u === "h") return qty * 60;
    return qty;
}

/** kcal に正規化 */
function energyToKcal(qty: number, units: string | undefined): number {
    if (!units) return qty;
    const u = units.toLowerCase();
    if (u === "kcal" || u === "cal" /* Apple 表記 */) return qty;
    if (u === "kj" || u === "kJ".toLowerCase()) return qty / 4.184;
    return qty;
}

const STEP_METRIC_NAMES = new Set(["step_count", "steps"]);
const EXERCISE_METRIC_NAMES = new Set(["apple_exercise_time", "exercise_time"]);
const ENERGY_METRIC_NAMES = new Set(["active_energy", "active_energy_burned"]);

export function parseDailyActivity(input: IncomingPayload): DailyActivityEntry[] {
    // フラット shape (iOS Shortcut 用) を優先検出
    const hasFlat =
        typeof input.steps === "number" ||
        typeof input.exerciseMinutes === "number" ||
        typeof input.activeKcal === "number";
    if (hasFlat) {
        const dayKey = toJstDayKey(input.date) ?? toJstDayKey(new Date().toISOString());
        if (!dayKey) return [];
        const steps = typeof input.steps === "number" && Number.isFinite(input.steps) ? Math.round(input.steps) : undefined;
        const exerciseMinutes = typeof input.exerciseMinutes === "number" && Number.isFinite(input.exerciseMinutes)
            ? Math.round(input.exerciseMinutes) : undefined;
        const activeKcal = typeof input.activeKcal === "number" && Number.isFinite(input.activeKcal)
            ? Math.round(input.activeKcal) : undefined;
        return [{
            id: `applehealth-daily-${dayKey}`,
            dayKey,
            date: dayKeyToPinnedIso(dayKey),
            title: "今日のアクティビティ",
            steps,
            exerciseMinutes,
            activeKcal,
        }];
    }

    const metrics = input.data?.metrics ?? input.metrics ?? [];
    if (!Array.isArray(metrics) || metrics.length === 0) return [];

    // dayKey -> { steps, exerciseMinutes, activeKcal } を集約
    const byDay = new Map<string, { steps?: number; exerciseMinutes?: number; activeKcal?: number }>();

    function bumpField(dayKey: string, field: "steps" | "exerciseMinutes" | "activeKcal", value: number) {
        const cur = byDay.get(dayKey) ?? {};
        cur[field] = (cur[field] ?? 0) + value;
        byDay.set(dayKey, cur);
    }

    for (const m of metrics) {
        const name = (m.name ?? "").toLowerCase();
        const samples = Array.isArray(m.data) ? m.data : [];
        for (const s of samples) {
            const dayKey = toJstDayKey(s.date);
            const qty = typeof s.qty === "number" && Number.isFinite(s.qty) ? s.qty : undefined;
            if (!dayKey || qty === undefined) continue;

            if (STEP_METRIC_NAMES.has(name)) {
                bumpField(dayKey, "steps", qty);
            } else if (EXERCISE_METRIC_NAMES.has(name)) {
                bumpField(dayKey, "exerciseMinutes", timeToMinutes(qty, m.units));
            } else if (ENERGY_METRIC_NAMES.has(name)) {
                bumpField(dayKey, "activeKcal", energyToKcal(qty, m.units));
            }
        }
    }

    const result: DailyActivityEntry[] = [];
    for (const [dayKey, agg] of byDay) {
        // 全フィールド未設定 (= 関係するメトリクスが何も来なかった日) はスキップ
        if (agg.steps === undefined && agg.exerciseMinutes === undefined && agg.activeKcal === undefined) continue;

        result.push({
            id: `applehealth-daily-${dayKey}`,
            dayKey,
            date: dayKeyToPinnedIso(dayKey),
            title: "今日のアクティビティ",
            steps: agg.steps !== undefined ? Math.round(agg.steps) : undefined,
            exerciseMinutes: agg.exerciseMinutes !== undefined ? Math.round(agg.exerciseMinutes) : undefined,
            activeKcal: agg.activeKcal !== undefined ? Math.round(agg.activeKcal) : undefined,
        });
    }
    return result;
}

// ---- State of Mind ----

function deriveMoodId(start: string, labels: string[]): string {
    return "mood-" + crypto.createHash("sha1").update(`${start}|${labels.join(",")}`).digest("hex").slice(0, 12);
}

function buildMoodTitle(labels: string[]): string {
    if (labels.length === 0) return "気分を記録";
    if (labels.length === 1) return labels[0];
    return labels.slice(0, 3).join(" · ");
}

export function parseStateOfMind(input: IncomingPayload): StateOfMindEntry[] {
    const list = input.data?.stateOfMind ?? input.stateOfMind ?? [];
    if (!Array.isArray(list)) return [];

    const result: StateOfMindEntry[] = [];
    for (const s of list) {
        const start = toIso(s.start);
        if (!start) continue;
        const labels = Array.isArray(s.labels) ? s.labels.filter((x): x is string => typeof x === "string") : [];
        const associations = Array.isArray(s.associations)
            ? s.associations.filter((x): x is string => typeof x === "string")
            : undefined;
        const id = (typeof s.id === "string" && s.id) ? s.id : deriveMoodId(start, labels);

        result.push({
            id,
            date: start,
            title: buildMoodTitle(labels),
            kind: typeof s.kind === "string" ? s.kind : "momentary",
            valence: typeof s.valence === "number" && Number.isFinite(s.valence) ? s.valence : undefined,
            valenceClassification: typeof s.valenceClassification === "number" && Number.isFinite(s.valenceClassification)
                ? s.valenceClassification : undefined,
            labels,
            associations: associations && associations.length > 0 ? associations : undefined,
        });
    }
    return result;
}

// ---- バックエンド: 全カテゴリ一括パース ----

export interface ParsedPayload {
    workouts: AppleHealthWorkoutEntry[];
    dailyActivity: DailyActivityEntry[];
    stateOfMind: StateOfMindEntry[];
}

export function parseHealthAutoExportPayload(input: unknown): ParsedPayload {
    if (!input || typeof input !== "object") {
        return { workouts: [], dailyActivity: [], stateOfMind: [] };
    }
    const payload = input as IncomingPayload;
    return {
        workouts: parseWorkouts(payload),
        dailyActivity: parseDailyActivity(payload),
        stateOfMind: parseStateOfMind(payload),
    };
}
