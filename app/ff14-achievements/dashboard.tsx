/** ff14-achievement ページ上部の統計。ビルド時にサーバーで計算する (以前はブラウザで JSON を読んでから出していた) */
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import type { Post } from "../lib/types";

export function renderFF14AchievementsDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    return (
        <PlatformDashboard
            platform="ff14-achievement"
            stats={[
                { label: "総実績数", value: posts.length },
            ]}
        />
    );
}

