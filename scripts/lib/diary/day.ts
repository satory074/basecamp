/**
 * 日記 v2 の日付ユーティリティ。対象ウィンドウは常に JST 暦日 [00:00, 24:00)。
 */

export const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DayWindow {
    /** YYYY-MM-DD (JST) */
    dayKey: string;
    /** 対象日 00:00 JST */
    start: Date;
    /** 翌日 00:00 JST (排他) */
    end: Date;
    year: number;
    month: number;
    day: number;
    /** 日曜日 / 月曜日 / ... */
    weekday: string;
}

const WEEKDAYS = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];

/** UTC Date → JST の YYYY-MM-DD */
export function jstDayKey(d: Date): string {
    return new Date(d.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

export function shiftDayKey(dayKey: string, days: number): string {
    const [y, m, d] = dayKey.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function dayWindow(dayKey: string): DayWindow {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
        throw new Error(`Invalid dayKey: ${dayKey}`);
    }
    const start = new Date(`${dayKey}T00:00:00+09:00`);
    if (isNaN(start.getTime())) throw new Error(`Invalid dayKey: ${dayKey}`);
    const end = new Date(start.getTime() + DAY_MS);
    const [year, month, day] = dayKey.split("-").map(Number);
    const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
    return { dayKey, start, end, year, month, day, weekday };
}

/** ISO 文字列が窓内 [start, end) にあるか。パース不能なら false */
export function inWindow(iso: string | undefined | null, w: { start: Date; end: Date }): boolean {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    if (isNaN(t)) return false;
    return t >= w.start.getTime() && t < w.end.getTime();
}

/** 対象日の直前 n 日間 [start - n日, start) */
export function daysBefore(w: DayWindow, n: number): { start: Date; end: Date } {
    return { start: new Date(w.start.getTime() - n * DAY_MS), end: w.start };
}

/** 2 つの時刻の差を日数 (切り捨て) で返す */
export function diffDays(later: Date, earlier: Date): number {
    return Math.floor((later.getTime() - earlier.getTime()) / DAY_MS);
}

/**
 * 実行時刻から対象日を決める。
 * - `TARGET_DATE=YYYY-MM-DD` があればそれ
 * - 無ければ実行時刻の JST 日付。ただし JST 0:00〜4:59 は前日扱い (cron 遅延・深夜実行対策)
 */
export function resolveTargetDayKey(env: NodeJS.ProcessEnv = process.env, now: Date = new Date()): string {
    const target = env.TARGET_DATE?.trim();
    if (target) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(target)) throw new Error(`TARGET_DATE must be YYYY-MM-DD: ${target}`);
        return target;
    }
    const jstHour = (now.getUTCHours() + 9) % 24;
    const key = jstDayKey(now);
    if (jstHour < 5) {
        console.log(`JST hour is ${jstHour} (0-4), treating as previous day`);
        return shiftDayKey(key, -1);
    }
    return key;
}

/** 「2026年8月13日」→ "2026-08-13"。形式不一致なら null */
export function parseJpDate(text: string | undefined | null): string | null {
    if (!text) return null;
    const m = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (!m) return null;
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

/** "2026-08-29" → "8月29日" */
export function formatJpDate(dayKey: string): string {
    const [, m, d] = dayKey.split("-").map(Number);
    return `${m}月${d}日`;
}
