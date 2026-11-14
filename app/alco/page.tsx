import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformFeed from "../components/feed/PlatformFeed";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import { getAlcoDays, getAlcoPosts, summarizeAlcoDays } from "../lib/feeds/alco";

export const metadata: Metadata = { ...pageMetadata("alco", "1杯ごとの飲酒記録"), robots: { index: false, follow: false } };

export default async function AlcoPage() {
    const [days, posts] = await Promise.all([getAlcoDays(), getAlcoPosts()]);
    const summary = summarizeAlcoDays(days);

    return (
        <div className="page">
            <PageHeader platform="alco" description="alco-diary で記録した1杯ごとのログ（金額は含まれません）" />

            {/* ストリークは休肝日側のみ表示する（連続飲酒日数は出さない） */}
            <PlatformDashboard
                stats={[
                    { label: "直近7日の純アルコール量", value: `${summary.last7dG}g` },
                    { label: "今月の休肝日", value: `${summary.restDaysThisMonth}日` },
                    { label: "休肝日ストリーク", value: `${summary.restDayStreak}日` },
                ]}
            />
            <PlatformFeed platform="alco" initialPosts={posts.slice(0, 20)} totalCount={posts.length} src="/api/alco" />
        </div>
    );
}
