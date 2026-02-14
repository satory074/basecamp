"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Post } from "../lib/types";
import { TweetWithFallback, CategoryBadge, getTweetId } from "@/app/components/shared/TweetEmbed";
import type { XTweet } from "@/app/components/shared/TweetEmbed";
import { FeedItemCard } from "@/app/components/shared/FeedItemCard";

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

                return (
                    <FeedItemCard
                        key={post.id}
                        post={post}
                        platform={post.platform}
                        isFeatured={isFeatured(post)}
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
