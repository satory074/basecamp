"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import type { Post } from "../lib/types";
import { platformColors, defaultPlatformColor } from "@/app/lib/shared/constants";
import { formatRelativeTime } from "@/app/lib/shared/date-utils";
import { Thumbnail, PlaceholderThumbnail } from "@/app/components/shared/Thumbnail";

const POSTS_PER_PAGE = 20;

interface FeedPostsProps {
    fetchPosts: () => Promise<Post[]>;
    icon?: string | React.ReactNode;
    source: string;
}

export default function FeedPosts({ fetchPosts, source }: FeedPostsProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const platformKey = source.toLowerCase();
    const colors = platformColors[platformKey] || defaultPlatformColor;

    const fetchData = useCallback(async () => {
        const data = await fetchPosts();
        setPosts(data);
        setIsLoading(false);
    }, [fetchPosts]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 無限スクロール
    const hasMore = visibleCount < posts.length;
    useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => Math.min(prev + POSTS_PER_PAGE, posts.length));
                }
            },
            { rootMargin: '100px' }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, posts.length]);

    const visiblePosts = posts.slice(0, visibleCount);

    if (isLoading) {
        return (
            <div className="py-12 text-center text-gray-500" role="status" aria-live="polite">
                {source}の投稿を読み込み中...
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="py-12 text-center text-gray-500">
                投稿が見つかりませんでした
            </div>
        );
    }

    return (
        <div>
            {visiblePosts.map((post) => (
                <article
                    key={post.id}
                    className={`feed-item platform-${platformKey}`}
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
                                <Thumbnail src={post.thumbnail} platform={platformKey} title={post.title} />
                            ) : (
                                <PlaceholderThumbnail platform={platformKey} />
                            )}
                            {/* コンテンツ */}
                            <div className="feed-item-content">
                                <div className="feed-item-header">
                                    <div className={`feed-item-dot ${colors.dot}`} />
                                    <span className="feed-item-platform capitalize">
                                        {source}
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
