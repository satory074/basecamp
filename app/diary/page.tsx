import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformFeed from "../components/feed/PlatformFeed";
import { getDiaryPosts } from "../lib/feeds/diary";
import { renderDiaryDashboard } from "./dashboard";

export const metadata: Metadata = pageMetadata("diary", "各サービスの活動を 1 日 1 枚にまとめたデイリーログ");

export default async function DiaryPage() {
    const posts = await getDiaryPosts();

    return (
        <div className="page">
            <PageHeader platform="diary" description="各サービスの活動を 1 日 1 枚にまとめたデイリーログ (見出しと導入文のみ AI が要約)" />

            {renderDiaryDashboard(posts)}
            <PlatformFeed platform="diary" initialPosts={posts.slice(0, 20)} totalCount={posts.length} src="/api/diary" />
        </div>
    );
}
