import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import PlatformFeed from "../components/feed/PlatformFeed";
import { DonutChart } from "../components/charts";
import { getXPosts } from "../lib/feeds/x";

export const metadata: Metadata = pageMetadata("x", "ポストといいね");

const CATEGORIES: { key: string; label: string; color: string }[] = [
    { key: "post", label: "投稿", color: "var(--color-x)" },
    { key: "repost", label: "リポスト", color: "#17bf63" },
    { key: "like", label: "いいね", color: "#e0245e" },
    { key: "bookmark", label: "ブックマーク", color: "#1da1f2" },
];

export default async function XPage() {
    const posts = await getXPosts();
    const counts = CATEGORIES.map((c) => ({ ...c, count: posts.filter((p) => p.category === c.key).length }))
        .filter((c) => c.count > 0);

    return (
        <div className="page">
            <PageHeader platform="x" description="投稿・いいね・ブックマーク" />

            <PlatformDashboard stats={counts.map((c) => ({ label: c.label, value: c.count }))} />
            {counts.length > 0 && (
                <div className="chart-block">
            <DonutChart
                slices={counts.map((c) => ({ label: c.label, value: c.count, color: c.color }))}
                centerLabel={String(posts.length)}
                centerSubLabel="件"
                title="種類の内訳"
            />
                </div>
            )}

            {/* X の埋め込みは 1 件ずつ X から読み込むので、1 ページを 10 件にする */}
            <PlatformFeed
                platform="x"
                initialPosts={posts.slice(0, 10)}
                totalCount={posts.length}
                src="/api/x"
                pageSize={10}
                filters={{
            label: "種類で絞り込む",
            field: "category",
            options: counts.map((c) => ({ key: c.key, label: c.label, count: c.count })),
                }}
            />
        </div>
    );
}
