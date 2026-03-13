"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Post } from "../lib/types";
import { RichFeedCard } from "@/app/components/shared/RichFeedCard";
import { TweetWithFallback, CategoryBadge, getTweetId } from "@/app/components/shared/TweetEmbed";
import type { XTweet } from "@/app/components/shared/TweetEmbed";
import PlatformDashboard from "@/app/components/dashboard/PlatformDashboard";
import type { StatItem } from "@/app/components/dashboard/PlatformDashboard";
import ActivityChart from "@/app/components/charts/ActivityChart";
import type { ActivityDatum } from "@/app/components/charts/ActivityChart";
import { BarChart, DonutChart } from "@/app/components/charts";
import type { BarDatum } from "@/app/components/charts/BarChart";
import type { DonutSlice } from "@/app/components/charts/DonutChart";

const POSTS_PER_PAGE = 20;

interface ContentItem extends Post {
    platform: string;
}

interface HomeFeedProps {
    initialPosts: ContentItem[];
    dashboardStats?: StatItem[];
    activityData?: ActivityDatum[];
    platformActivity?: BarDatum[];
}


export default function HomeFeed({ initialPosts, dashboardStats, activityData, platformActivity }: HomeFeedProps) {
    const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const visiblePosts = useMemo(() => initialPosts.slice(0, visibleCount), [initialPosts, visibleCount]);
    const platformDonutSlices: DonutSlice[] = useMemo(
        () => (platformActivity ?? []).map((d) => ({
            label: d.label,
            value: d.value,
            color: d.color ?? "#888888",
        })),
        [platformActivity]
    );
    const hasMore = visibleCount < initialPosts.length;

    useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => Math.min(prev + POSTS_PER_PAGE, initialPosts.length));
                }
            },
            { rootMargin: '100px' }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, initialPosts.length]);

    return (
        <div>
            {dashboardStats && dashboardStats.length > 0 && (
                <>
                    <PlatformDashboard platform="home" stats={dashboardStats} />
                    {activityData && activityData.length > 0 && (
                        <ActivityChart data={activityData} title="直近24時間のアクティビティ" />
                    )}
                    {platformActivity && platformActivity.length > 0 && (
                        <div className="chart-grid">
                            <DonutChart
                                slices={platformDonutSlices}
                                centerLabel={String(platformActivity.reduce((s, d) => s + d.value, 0))}
                                centerSubLabel="件"
                                title="プラットフォーム比率"
                            />
                            <BarChart
                                data={platformActivity}
                                horizontal
                                title="件数ランキング"
                            />
                        </div>
                    )}
                </>
            )}
            {visiblePosts.map(post => {
                if (post.platform === "x") {
                    const xPost = post as ContentItem & XTweet;
                    return (
                        <article key={post.id} className="feed-item platform-x feed-item-featured"
                            style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                            <CategoryBadge post={xPost} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <TweetWithFallback post={xPost} tweetId={getTweetId(xPost)} />
                            </div>
                        </article>
                    );
                }
                return (
                    <RichFeedCard
                        key={post.id}
                        post={post}
                        platform={post.platform}
                    />
                );
            })}

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
