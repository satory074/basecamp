/** note ページ上部の統計。ビルド時にサーバーで計算する (以前はブラウザで JSON を読んでから出していた) */
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import type { Post } from "../lib/types";
import { formatJstDateTime } from "../lib/shared/date-utils";

export function renderNoteDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    const latest = posts[0]?.date
        ? formatJstDateTime(posts[0].date, true)
        : "—";

    return (
        <PlatformDashboard
            platform="note"
            stats={[
                { label: "総記事数", value: posts.length },
                { label: "最新投稿", value: latest },
            ]}
        />
    );
}

