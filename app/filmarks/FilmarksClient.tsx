"use client";

import Image from "next/image";
import FeedPosts from "../components/FeedPosts";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import { DonutChart } from "../components/charts";
import type { Post } from "../lib/types";

// クライアント側でのデータ取得関数
async function fetchFilmarksPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/filmarks");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

// 高評価作品カードコンポーネント
function HighRatedCard({ post }: { post: Post }) {
    return (
        <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="high-rated-card"
        >
            {post.thumbnail ? (
                <Image
                    src={post.thumbnail}
                    alt={post.title}
                    width={120}
                    height={180}
                    className="high-rated-thumbnail"
                    style={{ objectFit: "cover" }}
                />
            ) : (
                <div className="high-rated-thumbnail high-rated-placeholder" />
            )}
            <div className="high-rated-info">
                <span className="high-rated-title">{post.title}</span>
                <span className="high-rated-rating">★ {post.rating}</span>
            </div>
        </a>
    );
}

// 高評価作品セクションコンポーネント
function HighRatedSection({ posts, title }: { posts: Post[]; title: string }) {
    if (posts.length === 0) return null;

    return (
        <section className="high-rated-section">
            <h2 className="text-lg font-semibold mb-4">{title}</h2>
            <div className="high-rated-grid">
                {posts.map((post) => (
                    <HighRatedCard key={post.id} post={post} />
                ))}
            </div>
        </section>
    );
}

interface FilmarksClientProps {
    highRatedMovies: Post[];
    highRatedDramas: Post[];
    highRatedAnimes: Post[];
}

function renderFilmarksDashboard(allPosts: Post[], highRatedCount: number) {
    if (allPosts.length === 0) return null;
    const ratings = allPosts
        .map((p) => p.rating)
        .filter((r): r is number => typeof r === "number" && r > 0);
    const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : "—";

    // Rating distribution buckets
    const r5 = ratings.filter((r) => r >= 4.5).length;
    const r4 = ratings.filter((r) => r >= 3.5 && r < 4.5).length;
    const r3 = ratings.filter((r) => r >= 2.5 && r < 3.5).length;
    const r2 = ratings.filter((r) => r >= 1.5 && r < 2.5).length;
    const r1 = ratings.filter((r) => r >= 0.5 && r < 1.5).length;

    const ratingSlices = [
        { label: "★5", value: r5, color: "#f9c74f" },
        { label: "★4", value: r4, color: "#f8961e" },
        { label: "★3", value: r3, color: "#43aa8b" },
        { label: "★2", value: r2, color: "#577590" },
        { label: "★1", value: r1, color: "#e63946" },
    ].filter((s) => s.value > 0);

    // Content type distribution
    const movies = allPosts.filter((p) => {
        const ct = (p as Post & { contentType?: string }).contentType;
        return !ct || ct === "movie";
    }).length;
    const dramas = allPosts.filter((p) => (p as Post & { contentType?: string }).contentType === "drama").length;
    const animes = allPosts.filter((p) => (p as Post & { contentType?: string }).contentType === "anime").length;
    const other = allPosts.length - movies - dramas - animes;

    const typeSlices = [
        { label: "映画", value: movies, color: "#FFE100" },
        { label: "ドラマ", value: dramas, color: "#f9844a" },
        { label: "アニメ", value: animes, color: "#4361ee" },
        ...(other > 0 ? [{ label: "その他", value: other, color: "#9ca3af" }] : []),
    ].filter((s) => s.value > 0);

    return (
        <>
            <PlatformDashboard
                platform="filmarks"
                stats={[
                    { label: "総視聴数", value: allPosts.length },
                    { label: "平均評価", value: avgRating },
                    { label: "高評価作品", value: highRatedCount },
                ]}
            />
            <div className="chart-grid">
                <DonutChart
                    slices={ratingSlices}
                    centerLabel={avgRating !== "—" ? avgRating : undefined}
                    centerSubLabel="平均評価"
                    title="評価分布"
                />
                {typeSlices.length > 1 && (
                    <DonutChart
                        slices={typeSlices}
                        centerLabel={String(allPosts.length)}
                        centerSubLabel="総視聴数"
                        title="コンテンツ種別"
                    />
                )}
            </div>
        </>
    );
}

export default function FilmarksClient({
    highRatedMovies,
    highRatedDramas,
    highRatedAnimes,
}: FilmarksClientProps) {
    const highRatedCount = highRatedMovies.length + highRatedDramas.length + highRatedAnimes.length;

    return (
        <>
            {/* 高評価作品セクション（カテゴリ別） */}
            <HighRatedSection posts={highRatedMovies} title="高評価映画" />
            <HighRatedSection posts={highRatedDramas} title="高評価ドラマ" />
            <HighRatedSection posts={highRatedAnimes} title="高評価アニメ" />

            {/* 全投稿 */}
            <FeedPosts
                fetchPosts={fetchFilmarksPosts}
                source="Filmarks"
                renderDashboard={(posts) => renderFilmarksDashboard(posts, highRatedCount)}
            />
        </>
    );
}
