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
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);

        if (diffHours < 1) return "たった今";
        if (diffHours < 24) return `${diffHours}時間前`;
        if (diffDays < 7) return `${diffDays}日前`;
        if (diffWeeks < 4) return `${diffWeeks}週間前`;
        return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
    } catch {
        return "";
    }
}
