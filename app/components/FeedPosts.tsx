"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import type { Post } from "../lib/types";

const POSTS_PER_PAGE = 20;

// プラットフォーム別の色クラス
const platformColors: Record<string, { dot: string; text: string; color: string }> = {
    hatena: { dot: "dot-hatena", text: "text-hatena", color: "#f03" },
    zenn: { dot: "dot-zenn", text: "text-zenn", color: "#0ea5e9" },
    github: { dot: "dot-github", text: "text-github", color: "#333" },
    soundcloud: { dot: "dot-soundcloud", text: "text-soundcloud", color: "#f50" },
    booklog: { dot: "dot-booklog", text: "text-booklog", color: "#b45309" },
    note: { dot: "dot-note", text: "text-note", color: "#41c9b4" },
    tenhou: { dot: "dot-tenhou", text: "text-tenhou", color: "#16a34a" },
    ff14: { dot: "dot-ff14", text: "text-ff14", color: "#3b82f6" },
    decks: { dot: "dot-decks", text: "text-decks", color: "#a855f7" },
    filmarks: { dot: "dot-filmarks", text: "text-filmarks", color: "#f7c600" },
};

interface FeedPostsProps {
    fetchPosts: () => Promise<Post[]>;
    icon?: string | React.ReactNode;
    source: string;
}

// プレースホルダー画像コンポーネント
function PlaceholderThumbnail({ platform }: { platform: string }) {
    const color = platformColors[platform]?.color || "#666";
    return (
        <div
            className="feed-item-thumbnail feed-item-placeholder"
            style={{ backgroundColor: `${color}15` }}
        >
            <div
                className="feed-item-placeholder-icon"
                style={{ backgroundColor: color }}
            />
        </div>
    );
}

// サムネイル画像コンポーネント
function Thumbnail({ src, platform }: { src: string; platform: string }) {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return <PlaceholderThumbnail platform={platform} />;
    }

    return (
        <div className="feed-item-thumbnail">
            <img
                src={src}
                alt=""
                className="feed-item-thumbnail-img"
                onError={() => setHasError(true)}
                loading="lazy"
            />
        </div>
    );
}

export default function FeedPosts({ fetchPosts, source }: FeedPostsProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const platformKey = source.toLowerCase();
    const colors = platformColors[platformKey] || { dot: "bg-gray-400", text: "", color: "#666" };

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

    const formatRelativeTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";

            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffWeeks = Math.floor(diffDays / 7);

            if (diffHours < 1) return "たった今";
            if (diffHours < 24) return `${diffHours}時間前`;
            if (diffDays < 7) return `${diffDays}日前`;
            if (diffWeeks < 4) return `${diffWeeks}週間前`;
            return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
        } catch {
            return "";
        }
    };

    if (isLoading) {
        return (
            <div className="py-12 text-center text-gray-500">
                Loading {source} posts...
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="py-12 text-center text-gray-500">
                No posts found.
            </div>
        );
    }

    return (
        <div>
            {visiblePosts.map((post) => (
                <a
                    key={post.id}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`feed-item platform-${platformKey}`}
                >
                    <div className="feed-item-with-thumb">
                        {/* サムネイル */}
                        {post.thumbnail ? (
                            <Thumbnail src={post.thumbnail} platform={platformKey} />
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
            ))}

            {hasMore && (
                <div ref={loadMoreRef} className="load-more-sentinel">
                    <span className="loading-spinner" />
                </div>
            )}
        </div>
    );
}
