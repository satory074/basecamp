/**
 * /playstation の日付表示。ページは build 時に静的生成されるので、相対時刻 (「3時間前」) は使わず
 * JST の絶対日付で出す (GitHub Actions の runner は UTC なので TZ を明示する)。
 */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toJst(iso: string): Date | null {
    const t = new Date(iso).getTime();
    return isNaN(t) ? null : new Date(t + JST_OFFSET_MS);
}

/** "2026/09/19" */
export function jstDate(iso: string): string {
    const d = toJst(iso);
    if (!d) return "";
    return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** "2026/09/19 15:09" */
export function jstDateTime(iso: string): string {
    const d = toJst(iso);
    if (!d) return "";
    return `${jstDate(iso)} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" → "9月19日 (土)" */
export function dayKeyLabel(dayKey: string): string {
    const [y, m, d] = dayKey.split("-").map(Number);
    const weekday = "日月火水木金土"[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    return `${m}月${d}日 (${weekday})`;
}
