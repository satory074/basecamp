/**
 * 日付を相対時刻形式でフォーマット
 * @param dateStr - ISO 8601形式の日付文字列
 * @returns 「たった今」「3時間前」「2日前」などの相対時刻文字列
 */
export function formatRelativeTime(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return "たった今";
        if (diffHours < 24) return `${diffHours}時間前`;

        const y = date.getFullYear();
        const mo = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const h = String(date.getHours()).padStart(2, "0");
        const mi = String(date.getMinutes()).padStart(2, "0");
        return `${y}-${mo}-${d} ${h}:${mi}`;
    } catch {
        return "";
    }
}

/**
 * 日付のみをフォーマット（時刻を出さない）
 * @param dateStr - ISO 8601形式の日付文字列
 * @returns 「2026-05-06」形式の文字列
 */
export function formatDateOnly(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";

        const y = date.getFullYear();
        const mo = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${mo}-${d}`;
    } catch {
        return "";
    }
}

/* ------------------------------------------------------------------
 * JST 固定の日付ヘルパー
 *
 * サイトは UTC のビルドサーバーで静的に書き出され、閲覧者のブラウザで再描画される。
 * 実行環境の TZ や「今」に依存すると、静的 HTML とブラウザで日付の区切りや
 * 「N時間前」がずれ、ハイドレーション不一致や古い表示の原因になる。
 * ここの関数は常に Asia/Tokyo で計算し、`now` を読まない。
 * ------------------------------------------------------------------ */

const JST = "Asia/Tokyo";
const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

// en-CA は YYYY-MM-DD 形式で出る
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
    timeZone: JST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: JST,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

/** ISO 文字列 → JST の暦日 "YYYY-MM-DD"。不正な日付は "" */
export function jstDayKey(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return dayKeyFormat.format(d);
}

/** ISO 文字列 → JST の "HH:mm" */
export function formatJstTime(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return timeFormat.format(d);
}

/**
 * "YYYY-MM-DD" → 「11月14日（土）」。`currentYear` と年が違うときだけ年を付ける。
 * `currentYear` は呼び出し側が「一番新しい投稿の年」などデータから決める (今を読まない)。
 */
export function formatJstDayHeading(dayKey: string, currentYear?: number): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
    if (!m) return "";
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const weekday = WEEKDAYS_JA[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
    const year = currentYear !== undefined && y !== currentYear ? `${y}年` : "";
    return `${year}${mo}月${d}日（${weekday}）`;
}

/** ISO 文字列 → 「2026年11月14日 09:05」(JST)。日付のみなら `dateOnly` */
export function formatJstDateTime(iso: string, dateOnly = false): string {
    const key = jstDayKey(iso);
    if (!key) return "";
    const [y, mo, d] = key.split("-").map(Number);
    const date = `${y}年${mo}月${d}日`;
    return dateOnly ? date : `${date} ${formatJstTime(iso)}`;
}

/**
 * 2 つの "YYYY-MM-DD" の差 (日数)。today - day。
 * 「今日 / 昨日」の判定はブラウザでハイドレーション後にだけ行う。
 */
export function dayKeyDiff(today: string, day: string): number {
    const toUtc = (k: string) => {
        const [y, mo, d] = k.split("-").map(Number);
        return Date.UTC(y, mo - 1, d);
    };
    return Math.round((toUtc(today) - toUtc(day)) / 86_400_000);
}
