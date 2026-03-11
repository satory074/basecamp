"use client";

import React, { useState, useEffect } from "react";
import type { Post } from "../lib/types";
import { formatRelativeTime } from "../lib/shared/date-utils";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import { BarChart } from "../components/charts";

interface DuolingoStats {
    streak: number;
    totalXp: number;
    courses: Array<{ title: string; learningLanguage: string; xp: number }>;
}

interface DuolingoStatsResponse {
    username: string;
    lastUpdated: string;
    currentStats: DuolingoStats;
    entries: Array<{
        id: string;
        date: string;
        title: string;
        description: string;
        category: "daily" | "milestone";
        xpGained: number;
        streak: number;
    }>;
}

async function fetchDuolingoStats(): Promise<DuolingoStatsResponse | null> {
    try {
        const response = await fetch("/data/duolingo-stats.json");
        if (!response.ok) return null;
        return response.json();
    } catch {
        return null;
    }
}

async function fetchDuolingoPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/duolingo");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

// カテゴリバッジの共通スタイル
const badgeStyle = (bgColor: string): React.CSSProperties => ({
    width: 20,
    height: 20,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: bgColor,
    color: "white",
    flexShrink: 0,
});

function CategoryBadge({ category }: { category?: string }) {
    if (category === "milestone") {
        return (
            <span style={badgeStyle("#FF9600")}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M12 23c-3.866 0-7-3.134-7-7 0-3.866 4-9 7-13 3 4 7 9.134 7 13 0 3.866-3.134 7-7 7zm0-2a5 5 0 0 0 5-5c0-2.5-2.5-6.5-5-10-2.5 3.5-5 7.5-5 10a5 5 0 0 0 5 5z" />
                </svg>
            </span>
        );
    }

    return (
        <span style={badgeStyle("#58CC02")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
        </span>
    );
}

function XpLineChart({ posts }: { posts: Post[] }) {
    if (posts.length < 2) return null;

    const sorted = [...posts]
        .filter((p) => typeof (p as Post & { xpGained?: number }).xpGained === "number")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-20);

    if (sorted.length < 2) return null;

    const xpValues = sorted.map((p) => (p as Post & { xpGained?: number }).xpGained ?? 0);
    const maxXp = Math.max(...xpValues, 1);
    const W = 260;
    const H = 60;
    const padX = 8;
    const padY = 6;

    const points = xpValues.map((xp, i) => ({
        x: padX + (i / (sorted.length - 1)) * (W - padX * 2),
        y: padY + (1 - xp / maxXp) * (H - padY * 2),
        xp,
    }));

    return (
        <div style={{ marginBottom: "1.5rem" }}>
            <div className="chart-section-title">XP推移（直近{sorted.length}件）</div>
            <div className="chart-container">
                <svg width={W} height={H + 4} style={{ display: "block" }}>
                    {points.map((pt, i) => {
                        const next = points[i + 1];
                        return next ? (
                            <line
                                key={i}
                                x1={pt.x} y1={pt.y}
                                x2={next.x} y2={next.y}
                                stroke="var(--color-duolingo)"
                                strokeWidth="2"
                                strokeOpacity="0.8"
                            />
                        ) : null;
                    })}
                    {points.map((pt, i) => (
                        <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="var(--color-duolingo)" />
                    ))}
                    <text x={padX} y={H - 2} fontSize="8" fill="var(--color-text-secondary)">0</text>
                    <text x={padX} y={padY + 4} fontSize="8" fill="var(--color-text-secondary)">{maxXp}</text>
                </svg>
            </div>
        </div>
    );
}

export default function DuolingoClient() {
    const [stats, setStats] = useState<DuolingoStats | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchDuolingoStats(), fetchDuolingoPosts()]).then(([statsData, postsData]) => {
            if (statsData) {
                setStats(statsData.currentStats);
            }
            setPosts(postsData);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="load-more-sentinel">
                <span className="loading-spinner" aria-hidden="true" />
            </div>
        );
    }

    // Course XP bar chart
    const courseData = (stats?.courses ?? [])
        .filter((c) => c.xp > 0)
        .sort((a, b) => b.xp - a.xp)
        .map((c) => ({ label: c.title || c.learningLanguage, value: c.xp }));

    return (
        <div>
            {/* Stats Strip Dashboard */}
            {stats && stats.totalXp > 0 && (
                <PlatformDashboard
                    platform="duolingo"
                    stats={[
                        { label: "連続日数", value: `${stats.streak}日` },
                        { label: "総XP", value: stats.totalXp.toLocaleString() },
                        { label: "言語数", value: stats.courses.length },
                    ]}
                />
            )}

            {/* Course XP chart */}
            {courseData.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                    <BarChart
                        data={courseData}
                        platformColor="var(--color-duolingo)"
                        title="コース別XP"
                    />
                </div>
            )}

            {/* XP trend line */}
            <XpLineChart posts={posts} />

            {/* Entries */}
            {posts.length === 0 ? (
                <p className="text-gray-500 text-sm">
                    Duolingoのデータがありません。GitHub Actionsでデータを取得してください。
                </p>
            ) : (
                <div>
                    {posts.map((post) => (
                        <a
                            key={post.id}
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="feed-item feed-item-link platform-duolingo"
                        >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                                <CategoryBadge category={post.category} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="feed-item-header">
                                        <span
                                            className="feed-item-dot dot-duolingo"
                                            aria-hidden="true"
                                        />
                                        <span className="feed-item-platform text-duolingo">
                                            Duolingo
                                        </span>
                                        <span className="feed-item-time">
                                            {formatRelativeTime(post.date)}
                                        </span>
                                    </div>
                                    <div className="feed-item-title">{post.title}</div>
                                    {post.description && (
                                        <p
                                            style={{
                                                fontSize: "0.875rem",
                                                color: "var(--color-text-secondary)",
                                                marginTop: "0.25rem",
                                            }}
                                        >
                                            {post.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
