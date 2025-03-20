"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Post } from "../lib/types";
import { getPostSummary } from "../lib/summaries";

interface FeedPostsProps {
    fetchPosts: () => Promise<Post[]>;
    icon: string | React.ReactNode;
    source: string;
    limit?: number; // 表示数の制限を追加（省略時は5件）
}

export default function FeedPosts({ fetchPosts, icon, source, limit = 5 }: FeedPostsProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // 各投稿の展開状態を管理するステート
    const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
    // 投稿の要約を管理するステート
    const [summaries, setSummaries] = useState<Record<string, string>>({});
    // 要約のロード状態を管理するステート
    const [loadingSummary, setLoadingSummary] = useState<Record<string, boolean>>({});

    const fetchData = useCallback(async () => {
        const data = await fetchPosts();
        setPosts(data);
        setIsLoading(false);
    }, [fetchPosts]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 日付を安全にフォーマットする関数
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            // 有効な日付かチェック
            if (isNaN(date.getTime())) {
                return "日付なし";
            }
            return date.toLocaleDateString("ja-JP");
        } catch (e) {
            console.error("Date formatting error:", e);
            return "日付なし";
        }
    };

    // 読了時間を計算する関数（文字数から推定）
    const getReadingTime = (text?: string): string => {
        if (!text) return "";
        // 1分あたり約500文字と仮定
        const wordsPerMinute = 500;
        const wordCount = text.length;
        const readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
        return `${readingTime}分で読めます`;
    };

    function isAllowedImageDomain(url: string): boolean {
        const allowedDomains = [
            "cdn.zenn.dev",
            "storage.googleapis.com",
            "cdn-ak.f.st-hatena.com",
            "cdn-ak-scissors.f.st-hatena.com",
            "secure.gravatar.com",
            "m.media-amazon.com",
            "cdn.image.st-hatena.com",
            "r2.sizu.me",
        ];

        try {
            const hostname = new URL(url).hostname;
            return allowedDomains.some((domain) => hostname.includes(domain));
        } catch {
            return false;
        }
    }

    // 投稿の展開/折りたたみを切り替える関数
    const togglePostExpansion = async (postId: string) => {
        // 既に開いている場合は閉じるだけ
        if (expandedPosts[postId]) {
            setExpandedPosts((prev) => ({
                ...prev,
                [postId]: false
            }));
            return;
        }

        // まだサマリーを取得していない場合は取得
        if (!summaries[postId]) {
            setLoadingSummary(prev => ({
                ...prev,
                [postId]: true
            }));

            try {
                const summary = await getPostSummary(postId);
                setSummaries(prev => ({
                    ...prev,
                    [postId]: summary
                }));
            } catch (error) {
                console.error(`Error fetching summary for post ${postId}:`, error);
            } finally {
                setLoadingSummary(prev => ({
                    ...prev,
                    [postId]: false
                }));
            }
        }

        // 展開状態を更新
        setExpandedPosts(prev => ({
            ...prev,
            [postId]: true
        }));
    };

    if (isLoading) {
        return <div className="my-8 p-4 text-center">Loading {source} posts...</div>;
    }

    if (posts.length === 0) {
        return <div className="my-8 p-4 text-center">No {source} posts found</div>;
    }

    return (
        <div className="my-8">
            <div className="grid gap-4">
                {posts.slice(0, limit).map((post) => (
                    <article
                        key={post.id}
                        className="bg-white dark:bg-gray-800 border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 h-[120px] md:h-[100px]"
                    >
                        <div className="flex h-full">
                            {/* サムネイル部分 - 固定サイズに設定 */}
                            <div className="w-[100px] h-full flex-shrink-0 relative overflow-hidden">
                                {post.thumbnail ? (
                                    <div className="w-full h-full relative bg-gray-100 dark:bg-gray-700">
                                        <Image
                                            src={post.thumbnail}
                                            alt={post.title}
                                            fill
                                            sizes="100px"
                                            className="object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = "none";
                                            }}
                                        />
                                    </div>
                                ) : (
                                    // サムネイルがない場合のプレースホルダー
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                        <div className="text-2xl text-gray-400 dark:text-gray-500">{icon}</div>
                                    </div>
                                )}
                            </div>

                            {/* コンテンツ部分 */}
                            <div className="p-3 flex-1 flex flex-col justify-between overflow-hidden">
                                <div className="overflow-hidden">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <span>{icon}</span>
                                            <time dateTime={post.date}>{formatDate(post.date)}</time>
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {post.description && getReadingTime(post.description)}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold mb-1 text-gray-800 dark:text-white line-clamp-1">
                                        <a
                                            href={post.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:underline"
                                        >
                                            {post.title}
                                        </a>
                                    </h3>

                                    {/* 説明文 - 展開時のみ表示するモーダルまたはオーバーレイ */}
                                    {expandedPosts[post.id] && (
                                        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                                                <h3 className="text-xl font-bold mb-4">{post.title}</h3>

                                                {/* 要約表示部分 */}
                                                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">要約</h4>
                                                    {loadingSummary[post.id] ? (
                                                        <div className="animate-pulse">
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full mb-2"></div>
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-700 dark:text-gray-200">
                                                            {summaries[post.id] || "この記事の要約はまだ生成されていません。"}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex justify-between">
                                                    <a
                                                        href={post.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        Read full article
                                                    </a>
                                                    <button
                                                        onClick={() => togglePostExpansion(post.id)}
                                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
                                                    >
                                                        Close
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="text-xs text-gray-500">{source}</div>
                                    <button
                                        onClick={() => togglePostExpansion(post.id)}
                                        className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
                                    >
                                        Show summary
                                    </button>
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
