"use client";

import { useEffect, useState, useRef } from "react";
import type { Post } from "../lib/types";
import { FeedItemCard } from "@/app/components/shared/FeedItemCard";

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

    // Normalize display name → platform key (e.g. "Hatena Bookmark" → "hatenabookmark", "FF14 Achievement" → "ff14-achievement")
    const sourceToKey: Record<string, string> = {
        "Hatena Bookmark": "hatenabookmark",
        "FF14 Achievement": "ff14-achievement",
    };
    const platformKey = sourceToKey[source] || source.toLowerCase();

    useEffect(() => {
        let isCancelled = false;

        void fetchPosts()
            .then((data) => {
                if (!isCancelled) {
                    setPosts(data);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setPosts([]);
                    setIsLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [fetchPosts]);

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
                <FeedItemCard
                    key={post.id}
                    post={post}
                    platform={platformKey}
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
