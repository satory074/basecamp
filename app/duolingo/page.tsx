import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import PlatformFeed from "../components/feed/PlatformFeed";
import { BarChart } from "../components/charts";
import { getDuolingoPosts, getDuolingoStats } from "../lib/feeds/duolingo";
import { formatJstDateTime } from "../lib/shared/date-utils";

export const metadata: Metadata = pageMetadata("duolingo", "語学学習の進捗");

/** 直近の XP の推移 (1 日 1 点)。数値は表にも出すので、グラフは見た目の補助 */
function XpTrend({ entries }: { entries: { date: string; xpGained: number }[] }) {
    if (entries.length < 2) return null;
    const W = 320;
    const H = 72;
    const pad = 8;
    const max = Math.max(...entries.map((e) => e.xpGained), 1);
    const points = entries.map((e, i) => ({
        x: pad + (i / (entries.length - 1)) * (W - pad * 2),
        y: pad + (1 - e.xpGained / max) * (H - pad * 2),
    }));
    const first = entries[0];
    const last = entries[entries.length - 1];
    const label = `直近 ${entries.length} 回の獲得 XP。最大 ${max} XP、${formatJstDateTime(first.date, true)} から ${formatJstDateTime(last.date, true)} まで`;
    return (
        <figure className="chart-block">
            <figcaption className="section-heading">XP の推移（直近 {entries.length} 回）</figcaption>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxInlineSize: "32rem", display: "block" }} role="img" aria-label={label}>
                <polyline
                    points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke="var(--color-duolingo)"
                    strokeWidth="2"
                />
                {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--color-duolingo)" />)}
            </svg>
        </figure>
    );
}

export default async function DuolingoPage() {
    // 以前はブラウザが /data/duolingo-stats.json を読みに行き、本番では 404 で統計が出ていなかった
    const [stats, posts] = await Promise.all([getDuolingoStats(), getDuolingoPosts()]);
    const current = stats?.currentStats;
    const courses = (current?.courses ?? [])
        .filter((c) => c.xp > 0)
        .sort((a, b) => b.xp - a.xp)
        .map((c) => ({ label: c.title || c.learningLanguage, value: c.xp }));
    const trend = (stats?.entries ?? [])
        .filter((e) => e.category === "daily" && e.xpGained > 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-20);

    return (
        <div className="page">
            <PageHeader platform="duolingo" description="語学の学習記録" />

            {current && current.totalXp > 0 && (
                <PlatformDashboard
            stats={[
                { label: "連続日数", value: `${current.streak.toLocaleString("ja-JP")}日` },
                { label: "総 XP", value: current.totalXp },
                { label: "学習中の言語", value: current.courses.length },
            ]}
                />
            )}
            {courses.length > 0 && (
                <div className="chart-block">
            <BarChart data={courses} platformColor="var(--color-duolingo)" title="コース別 XP" />
                </div>
            )}
            <XpTrend entries={trend} />

            <PlatformFeed platform="duolingo" initialPosts={posts.slice(0, 20)} totalCount={posts.length} src="/api/duolingo" />
        </div>
    );
}
