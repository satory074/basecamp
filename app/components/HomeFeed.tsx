"use client";

import { useState, useEffect, useRef, useMemo, memo } from "react";
import { Post } from "../lib/types";
import { platformColors, defaultPlatformColor } from "@/app/lib/shared/constants";
import { formatRelativeTime } from "@/app/lib/shared/date-utils";
import { Thumbnail, PlaceholderThumbnail } from "@/app/components/shared/Thumbnail";

const POSTS_PER_PAGE = 20;

interface ContentItem extends Post {
    platform: string;
}

interface HomeFeedProps {
    initialPosts: ContentItem[];
}

// X カテゴリ別サムネイル
const XCategoryThumbnail = memo(function XCategoryThumbnail({ category, isRetweet }: { category?: string; isRetweet?: boolean }) {
    const isRepost = isRetweet || category === "repost";

    let bgColor: string;
    let icon: React.ReactNode;

    if (isRepost) {
        bgColor = "#00ba7c";
        icon = (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
        );
    } else if (category === "like") {
        bgColor = "#f91880";
        icon = (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        );
    } else if (category === "bookmark") {
        bgColor = "#1d9bf0";
        icon = (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
        );
    } else {
        // Original post — X logo style
        bgColor = "#000000";
        icon = (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        );
    }

    return (
        <div
            className="feed-item-thumbnail-placeholder"
            style={{ backgroundColor: bgColor, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}
        >
            {icon}
        </div>
    );
});

// フィーチャー投稿の判定（目立たせる対象）
const isFeatured = (post: ContentItem): boolean => {
    // note, zenn, hatena, filmarks, spotify, ff14-achievement, tenhouは常にfeatured
    if (['note', 'zenn', 'hatena', 'filmarks', 'spotify', 'ff14-achievement', 'tenhou', 'x'].includes(post.platform)) {
        return true;
    }
    // booklogは「読み終わった」のみfeatured
    if (post.platform === 'booklog' && post.description === '読み終わった') {
        return true;
    }
    return false;
};

export default function HomeFeed({ initialPosts }: HomeFeedProps) {
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
            {visiblePosts.map(post => {
                const colors = platformColors[post.platform] || defaultPlatformColor;
                return (
                    <article
                        key={post.id}
                        className={`feed-item platform-${post.platform}${isFeatured(post) ? ' feed-item-featured' : ''}`}
                    >
                        <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="feed-item-link"
                        >
                            <div className="feed-item-with-thumb">
                                {/* サムネイル */}
                                {post.thumbnail ? (
                                    <Thumbnail src={post.thumbnail} platform={post.platform} title={post.title} />
                                ) : post.platform === "x" ? (
                                    <XCategoryThumbnail category={post.category} isRetweet={post.description?.startsWith("RT @")} />
                                ) : (
                                    <PlaceholderThumbnail platform={post.platform} />
                                )}
                                {/* コンテンツ */}
                                <div className="feed-item-content">
                                    <div className="feed-item-header">
                                        <div className={`feed-item-dot ${colors.dot}`} />
                                        <span className="feed-item-platform capitalize">
                                            {post.platform}
                                        </span>
                                        <span className="feed-item-time">
                                            • {formatRelativeTime(post.date)}
                                        </span>
                                        {post.stars !== undefined && post.stars > 0 && (
                                            <span className="feed-item-meta">
                                                ⭐ {post.stars}
                                            </span>
                                        )}
                                        {post.likes !== undefined && post.likes > 0 && (
                                            <span className="feed-item-meta">
                                                ❤️ {post.likes}
                                            </span>
                                        )}
                                        {post.rating !== undefined && post.rating > 0 && (
                                            <span className="feed-item-meta">
                                                ★ {post.rating}
                                            </span>
                                        )}
                                        {post.language && (
                                            <span className="feed-item-meta text-gray-400">
                                                {post.language}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="feed-item-title">{post.title}</h3>
                                    {post.description && (
                                        <p className="feed-item-description text-gray-500 text-sm mt-1 line-clamp-2">
                                            {post.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </a>
                    </article>
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
