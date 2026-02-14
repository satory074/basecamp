"use client";

import { useState, useEffect, useRef } from "react";
import {
    XTweet,
    TweetWithFallback,
    CategoryBadge,
    getTweetId,
} from "../components/shared/TweetEmbed";

const TWEETS_PER_PAGE = 10;

async function fetchXPosts(): Promise<XTweet[]> {
    try {
        const response = await fetch("/api/x");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

export default function XClient() {
    const [posts, setPosts] = useState<XTweet[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(TWEETS_PER_PAGE);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchXPosts().then((data) => {
            setPosts(data);
            setLoading(false);
        });
    }, []);

    const hasMore = visibleCount < posts.length;

    useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => Math.min(prev + TWEETS_PER_PAGE, posts.length));
                }
            },
            { rootMargin: '200px' }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, posts.length]);

    if (loading) {
        return (
            <div className="load-more-sentinel">
                <span className="loading-spinner" aria-hidden="true" />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <p className="text-gray-500 text-sm">
                ツイートデータがありません。public/data/x-tweets.json にツイートIDを追加してください。
            </p>
        );
    }

    const visiblePosts = posts.slice(0, visibleCount);

    return (
        <div className="space-y-4">
            {visiblePosts.map((post) => (
                <div key={post.id} data-theme="light" style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <CategoryBadge post={post} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <TweetWithFallback post={post} tweetId={getTweetId(post)} />
                    </div>
                </div>
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
