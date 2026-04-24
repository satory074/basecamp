"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { Post } from "../lib/types";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import { DonutChart } from "../components/charts";
import { RichFeedCard } from "../components/shared/RichFeedCard";

const POSTS_PER_PAGE = 20;

const ALL_STATUSES = ["読み終わった", "いま読んでる", "読みたい", "積読", "また読みたい"];
const STATUS_LABELS: Record<string, string> = {
    "読み終わった": "読み終わった",
    "いま読んでる": "読書中",
    "読みたい": "読みたい",
    "積読": "積読",
    "また読みたい": "また読みたい",
};

async function fetchBooklogPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/booklog");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

function HighRatedCard({ post }: { post: Post }) {
    return (
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="high-rated-card">
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
                <div className="high-rated-thumbnail high-rated-placeholder high-rated-placeholder--booklog" />
            )}
            <div className="high-rated-info">
                <span className="high-rated-title">{post.title}</span>
                <span className="high-rated-rating high-rated-rating--booklog">★★★★★</span>
            </div>
        </a>
    );
}

function HighRatedSection({ posts }: { posts: Post[] }) {
    if (posts.length === 0) return null;
    return (
        <section className="high-rated-section">
            <h2 className="text-lg font-semibold mb-4">★5の本</h2>
            <div className="high-rated-grid">
                {posts.map((post) => (
                    <HighRatedCard key={post.id} post={post} />
                ))}
            </div>
        </section>
    );
}

interface BooklogClientProps {
    highRatedBooks: Post[];
}

export default function BooklogClient({ highRatedBooks }: BooklogClientProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchBooklogPosts().then((data) => {
            setPosts(data);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        setVisibleCount(POSTS_PER_PAGE);
    }, [selectedStatus]);

    const filteredPosts = selectedStatus === "all"
        ? posts
        : posts.filter((p) => p.description === selectedStatus);

    const hasMore = visibleCount < filteredPosts.length;

    useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => Math.min(prev + POSTS_PER_PAGE, filteredPosts.length));
                }
            },
            { rootMargin: "200px" }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, filteredPosts.length]);

    const done = posts.filter((p) => p.description === "読み終わった").length;
    const reading = posts.filter((p) => p.description === "いま読んでる").length;
    const tbr = posts.filter((p) => p.description === "積読").length;

    const statusSlices = [
        { label: "読了", value: done, color: "#4ea6cc" },
        { label: "読書中", value: reading, color: "#43aa8b" },
        { label: "積読", value: tbr, color: "#f9844a" },
    ].filter((s) => s.value > 0);

    const filterTabs = [
        { key: "all", label: "全て", count: posts.length },
        ...ALL_STATUSES
            .map((s) => ({
                key: s,
                label: STATUS_LABELS[s] ?? s,
                count: posts.filter((p) => p.description === s).length,
            }))
            .filter((t) => t.count > 0),
    ];

    const highRated = posts.length > 0
        ? posts.filter((p) => p.rating === 5).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : highRatedBooks;

    if (loading) {
        return (
            <>
                <HighRatedSection posts={highRatedBooks} />
                <div className="load-more-sentinel">
                    <span className="loading-spinner" aria-hidden="true" />
                </div>
            </>
        );
    }

    if (posts.length === 0) {
        return (
            <>
                <HighRatedSection posts={highRatedBooks} />
                <p className="text-gray-500 text-sm">読書データがありません。</p>
            </>
        );
    }

    return (
        <div className="space-y-4">
            <HighRatedSection posts={highRated} />

            <PlatformDashboard
                platform="booklog"
                stats={[
                    { label: "読了", value: done },
                    { label: "読書中", value: reading },
                    { label: "積読", value: tbr },
                    { label: "総冊数", value: posts.length },
                ]}
            />

            {statusSlices.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                    <DonutChart
                        slices={statusSlices}
                        centerLabel={String(posts.length)}
                        centerSubLabel="総冊数"
                        title="読書状況"
                    />
                </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                {filterTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setSelectedStatus(tab.key)}
                        style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.8rem",
                            fontWeight: selectedStatus === tab.key ? 600 : 400,
                            border: `1px solid ${selectedStatus === tab.key ? "var(--color-booklog)" : "var(--color-border)"}`,
                            background: selectedStatus === tab.key ? "var(--color-booklog)" : "transparent",
                            color: selectedStatus === tab.key ? "#fff" : "var(--color-text-secondary)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                        }}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {filteredPosts.slice(0, visibleCount).map((post) => (
                <RichFeedCard key={post.id} post={post} platform="booklog" />
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
