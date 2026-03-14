"use client";

import { useState, useEffect, useRef } from "react";
import type { XTweet } from "../components/shared/TweetEmbed";
import { TweetWithFallback, CategoryBadge, getTweetId } from "../components/shared/TweetEmbed";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import { DonutChart } from "../components/charts";

const TWEETS_PER_PAGE = 10;

type CategoryFilter = "all" | "post" | "repost" | "like" | "bookmark";

async function fetchXPosts(): Promise<XTweet[]> {
    try {
        const response = await fetch("/api/x");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

export default function XClient() {
    const [posts, setPosts] = useState<XTweet[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(TWEETS_PER_PAGE);
    const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchXPosts().then((data) => {
            setPosts(data);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        setVisibleCount(TWEETS_PER_PAGE);
    }, [selectedCategory]);

    const filteredPosts = selectedCategory === "all"
        ? posts
        : posts.filter((p) => p.category === selectedCategory);

    const hasMore = visibleCount < filteredPosts.length;

    useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => Math.min(prev + TWEETS_PER_PAGE, filteredPosts.length));
                }
            },
            { rootMargin: '200px' }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, filteredPosts.length]);

    if (loading) {
        return (
            <div className="load-more-sentinel">
                <span className="loading-spinner" aria-hidden="true" />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <p className="text-gray-500 text-sm">
                ツイートデータがありません。public/data/x-tweets.json にツイートIDを追加してください。
            </p>
        );
    }

    const visiblePosts = filteredPosts.slice(0, visibleCount);

    const postCount = posts.filter((p) => p.category === "post").length;
    const repostCount = posts.filter((p) => p.category === "repost").length;
    const likeCount = posts.filter((p) => p.category === "like").length;
    const bookmarkCount = posts.filter((p) => p.category === "bookmark").length;

    const categorySlices = [
        { label: "投稿", value: postCount, color: "#000000" },
        { label: "リポスト", value: repostCount, color: "#17bf63" },
        { label: "いいね", value: likeCount, color: "#e0245e" },
        { label: "ブックマーク", value: bookmarkCount, color: "#1da1f2" },
    ].filter((s) => s.value > 0);

    const allTabs: { key: CategoryFilter; label: string; count: number }[] = [
        { key: "all", label: "全て", count: posts.length },
        { key: "post", label: "投稿", count: postCount },
        { key: "repost", label: "リポスト", count: repostCount },
        { key: "like", label: "いいね", count: likeCount },
        { key: "bookmark", label: "ブックマーク", count: bookmarkCount },
    ];
    const filterTabs = allTabs.filter((t) => t.key === "all" || t.count > 0);

    return (
        <div className="space-y-4">
            <PlatformDashboard
                platform="x"
                stats={[
                    { label: "投稿", value: postCount },
                    { label: "リポスト", value: repostCount },
                    { label: "いいね", value: likeCount },
                    { label: "ブックマーク", value: bookmarkCount },
                ]}
            />
            {categorySlices.length > 0 && (
                <div style={{ marginBottom: "0.5rem" }}>
                    <DonutChart
                        slices={categorySlices}
                        centerLabel={String(posts.length)}
                        centerSubLabel="総件数"
                        title="カテゴリ分布"
                    />
                </div>
            )}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                {filterTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setSelectedCategory(tab.key)}
                        style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.8rem",
                            fontWeight: selectedCategory === tab.key ? 600 : 400,
                            border: `1px solid ${selectedCategory === tab.key ? "var(--color-x)" : "var(--color-border)"}`,
                            background: selectedCategory === tab.key ? "var(--color-x)" : "transparent",
                            color: selectedCategory === tab.key ? "#fff" : "var(--color-text-secondary)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                        }}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>
            {visiblePosts.map((post) => (
                <div key={post.id} className="feed-item platform-x" style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <CategoryBadge post={post} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <TweetWithFallback post={post} tweetId={getTweetId(post)} />
                    </div>
                </div>
            ))}

            {hasMore && (
                <div
                    ref={loadMoreRef}
                    className="load-more-sentinel"
                    role="status"
                    aria-live="polite"
                    aria-label="読み込み中..."
                >
                    <span className="loading-spinner" aria-hidden="true" />
                </div>
            )}
        </div>
    );
}
