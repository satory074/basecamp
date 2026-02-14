"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Post } from "../lib/types";
import { platformColors, defaultPlatformColor } from "@/app/lib/shared/constants";
import { formatRelativeTime } from "@/app/lib/shared/date-utils";
import { Thumbnail, PlaceholderThumbnail } from "@/app/components/shared/Thumbnail";
import { TweetWithFallback, CategoryBadge, getTweetId } from "@/app/components/shared/TweetEmbed";
import type { XTweet } from "@/app/components/shared/TweetEmbed";

const POSTS_PER_PAGE = 20;

interface ContentItem extends Post {
    platform: string;
}

interface HomeFeedProps {
    initialPosts: ContentItem[];
}

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
                // X ポストはツイート埋め込みで表示
                if (post.platform === "x") {
                    const xPost = post as ContentItem & XTweet;
                    return (
                        <article
                            key={post.id}
                            className={`feed-item platform-x feed-item-featured`}
                            data-theme="light"
                            style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}
                        >
                            <CategoryBadge post={xPost} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <TweetWithFallback post={xPost} tweetId={getTweetId(xPost)} />
                            </div>
                        </article>
                    );
                }

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
