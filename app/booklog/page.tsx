import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import PlatformFeed from "../components/feed/PlatformFeed";
import { DonutChart } from "../components/charts";
import { getBooklogPosts } from "../lib/feeds/booklog";
import { HighRatedSection } from "./parts";

export const metadata: Metadata = pageMetadata("booklog", "Booklog読書記録");

/** ブクログの status_name → 絞り込みボタンの表示名 */
const STATUSES: { key: string; label: string }[] = [
    { key: "読み終わった", label: "読み終わった" },
    { key: "いま読んでる", label: "読書中" },
    { key: "読みたい", label: "読みたい" },
    { key: "積読", label: "積読" },
    { key: "また読みたい", label: "また読みたい" },
];

export default async function BooklogPage() {
    const posts = await getBooklogPosts();
    const count = (status: string) => posts.filter((p) => p.description === status).length;
    const done = count("読み終わった");
    const reading = count("いま読んでる");
    const tbr = count("積読");
    const highRatedBooks = posts
        .filter((p) => p.rating === 5)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const statusSlices = [
        { label: "読了", value: done, color: "var(--color-booklog)" },
        { label: "読書中", value: reading, color: "#43aa8b" },
        { label: "積読", value: tbr, color: "#f9844a" },
    ].filter((s) => s.value > 0);

    return (
        <div className="page">
            <PageHeader platform="booklog" description="読書記録" />

            <PlatformDashboard
                stats={[
            { label: "総冊数", value: posts.length },
            { label: "読了", value: done },
            { label: "読書中", value: reading },
            { label: "積読", value: tbr },
                ]}
            />
            {statusSlices.length > 0 && (
                <div className="chart-block">
            <DonutChart slices={statusSlices} centerLabel={String(posts.length)} centerSubLabel="総冊数" title="読書状況" />
                </div>
            )}

            <HighRatedSection posts={highRatedBooks} />

            <section aria-labelledby="booklog-all">
                <h2 id="booklog-all" className="section-heading">本棚</h2>
                <PlatformFeed
            platform="booklog"
            initialPosts={posts.slice(0, 20)}
            totalCount={posts.length}
            src="/api/booklog"
            filters={{
                label: "読書の状態で絞り込む",
                field: "description",
                options: STATUSES.map((s) => ({ ...s, count: count(s.key) })).filter((s) => s.count > 0),
            }}
                />
            </section>
        </div>
    );
}
