"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Post } from "../lib/types";
import { RichFeedCard } from "@/app/components/shared/RichFeedCard";
import PlatformDashboard from "@/app/components/dashboard/PlatformDashboard";
import type { StatItem } from "@/app/components/dashboard/PlatformDashboard";

const POSTS_PER_PAGE = 20;

interface ContentItem extends Post {
    platform: string;
}

interface HomeFeedProps {
    initialPosts: ContentItem[];
    dashboardStats?: StatItem[];
}


export default function HomeFeed({ initialPosts, dashboardStats }: HomeFeedProps) {
    const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const visiblePosts = useMemo(() => initialPosts.slice(0, visibleCount), [initialPosts, visibleCount]);
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
                <PlatformDashboard platform="home" stats={dashboardStats} />
            )}
            {visiblePosts.map(post => (
                <RichFeedCard
                    key={post.id}
                    post={post}
                    platform={post.platform}
                />
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
