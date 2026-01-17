"use client";

import { useState, useEffect, useRef } from "react";
import { Post } from "../lib/types";

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
};

interface ContentItem extends Post {
    platform: string;
}

interface HomeFeedProps {
    initialPosts: ContentItem[];
}

// フィーチャー投稿の判定（目立たせる対象）
const isFeatured = (post: ContentItem): boolean => {
    // note, zenn, hatenaは常にfeatured
    if (['note', 'zenn', 'hatena'].includes(post.platform)) {
        return true;
    }
    // booklogは「読み終わった」のみfeatured
    if (post.platform === 'booklog' && post.description === '読み終わった') {
        return true;
    }
    return false;
};

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

export default function HomeFeed({ initialPosts }: HomeFeedProps) {
    const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const visiblePosts = initialPosts.slice(0, visibleCount);
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

    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
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
    };

    return (
        <div>
            {visiblePosts.map(post => {
                const colors = platformColors[post.platform] || { dot: "bg-gray-400", text: "", color: "#666" };
                return (
                    <a
                        key={post.id}
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`feed-item platform-${post.platform}${isFeatured(post) ? ' feed-item-featured' : ''}`}
                    >
                        <div className="feed-item-with-thumb">
                            {/* サムネイル */}
                            {post.thumbnail ? (
                                <Thumbnail src={post.thumbnail} platform={post.platform} />
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
                );
            })}

            {hasMore && (
                <div ref={loadMoreRef} className="load-more-sentinel">
                    <span className="loading-spinner" />
                </div>
            )}
        </div>
    );
}
