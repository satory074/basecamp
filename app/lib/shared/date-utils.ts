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
