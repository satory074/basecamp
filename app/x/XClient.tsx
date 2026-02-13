"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Tweet } from "react-tweet";
import type { Post } from "../lib/types";
import { formatRelativeTime } from "../lib/shared/date-utils";

interface XTweet extends Post {
    category?: string;
    isRetweet?: boolean;
}

async function fetchXPosts(): Promise<XTweet[]> {
    try {
        const response = await fetch("/api/x");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

// react-tweet が失敗した場合のフォールバックカード
function TweetFallback({ post }: { post: XTweet }) {
    return (
        <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            style={{ borderColor: "var(--color-border)" }}
        >
            <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">@satory074</span>
                <span className="text-xs text-gray-500">
                    {formatRelativeTime(post.date)}
                </span>
            </div>
            <p className="text-sm" style={{ color: "var(--color-text)" }}>
                {post.description || post.title}
            </p>
        </a>
    );
}

// React Error Boundary（クラスコンポーネント必須）
class TweetErrorBoundary extends React.Component<
    { fallback: React.ReactNode; children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

// Tweet + Error Boundary + Suspense ラッパー
function TweetWithFallback({ post, tweetId }: { post: XTweet; tweetId: string }) {
    return (
        <TweetErrorBoundary fallback={<TweetFallback post={post} />}>
            <Suspense fallback={<TweetFallback post={post} />}>
                <Tweet id={tweetId} />
            </Suspense>
        </TweetErrorBoundary>
    );
}

// カテゴリラベルコンポーネント
function CategoryLabel({ post }: { post: XTweet }) {
    const isRetweet = post.isRetweet || post.description?.startsWith("RT @");

    // オリジナルPost（リポストでない）はラベルなし
    if (post.category === "post" && !isRetweet) {
        return null;
    }

    if (isRetweet) {
        return (
            <div className="x-category-label x-category-repost">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                <span>Reposted</span>
            </div>
        );
    }

    if (post.category === "like") {
        return (
            <div className="x-category-label x-category-like">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>Liked</span>
            </div>
        );
    }

    if (post.category === "bookmark") {
        return (
            <div className="x-category-label x-category-bookmark">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span>Bookmarked</span>
            </div>
        );
    }

    return null;
}

export default function XClient() {
    const [posts, setPosts] = useState<XTweet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchXPosts().then((data) => {
            setPosts(data);
            setLoading(false);
        });
    }, []);

    // ツイートIDを抽出（id形式: "x-{tweetId}"）
    const getTweetId = (post: XTweet): string => post.id.replace("x-", "");

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

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <div key={post.id} data-theme="light">
                    <CategoryLabel post={post} />
                    <TweetWithFallback post={post} tweetId={getTweetId(post)} />
                </div>
            ))}
        </div>
    );
}
