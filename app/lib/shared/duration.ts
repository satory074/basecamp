/**
 * 秒数 → 日本語のプレイ時間表記。
 *
 *   1 時間未満     → "45分"
 *   1〜99 時間     → "3時間12分" (分が 0 なら "3時間")
 *   100 時間以上   → "1,984時間" (分は落とす)
 */
export function formatDuration(seconds: number): string {
    const totalMinutes = Math.max(0, Math.floor(seconds / 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours >= 100) return `${hours.toLocaleString("en-US")}時間`;
    if (hours >= 1) return minutes > 0 ? `${hours}時間${minutes}分` : `${hours}時間`;
    return `${minutes}分`;
}
