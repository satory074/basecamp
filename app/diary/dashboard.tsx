/** diary ページ上部の統計。ビルド時にサーバーで計算する (以前はブラウザで JSON を読んでから出していた) */
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import type { Post } from "../lib/types";
import { formatJstDateTime } from "../lib/shared/date-utils";

export function renderDiaryDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    const latest = posts[0]?.date
        ? formatJstDateTime(posts[0].date, true)
        : "—";

    return (
        <PlatformDashboard
            platform="diary"
            stats={[
                { label: "総エントリ数", value: posts.length },
                { label: "最新投稿", value: latest },
            ]}
        />
    );
}

