import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformFeed from "../components/feed/PlatformFeed";
import { getFF14AchievementPosts } from "../lib/feeds/ff14-achievements";
import { renderFF14AchievementsDashboard } from "./dashboard";

export const metadata: Metadata = pageMetadata("ff14-achievement", "FF14 取得済みアチーブメント一覧", "/ff14-achievements/");

export default async function FF14AchievementsPage() {
    const posts = await getFF14AchievementPosts();

    return (
        <div className="page">
            <PageHeader platform="ff14-achievement" description="取得済みアチーブメント一覧" />

            {renderFF14AchievementsDashboard(posts)}
            <PlatformFeed platform="ff14-achievement" initialPosts={posts.slice(0, 20)} totalCount={posts.length} src="/api/ff14-achievements" />
        </div>
    );
}
