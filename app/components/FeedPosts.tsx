"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, useRef } from "react";
import type { Post } from "../lib/types";
import { getPostSummary } from "../lib/summaries";
import LoadingSkeleton from "./LoadingSkeleton";

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


    // モーダルのref
    const modalRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const closeButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

        // モーダルが開いたらフォーカスを設定
        setTimeout(() => {
            if (closeButtonRefs.current[postId]) {
                closeButtonRefs.current[postId]?.focus();
            }
        }, 100);
    };

    if (isLoading) {
        return <LoadingSkeleton rows={limit} />;
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
                        className="bg-white dark:bg-gray-800 border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 min-h-[100px] md:min-h-[120px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                        role="article"
                        aria-labelledby={`post-title-${post.id}`}
                    >
                        <div className="flex h-full">
                            {/* サムネイル部分 - レスポンシブ対応 */}
                            <div className="w-[80px] sm:w-[100px] h-full flex-shrink-0 relative overflow-hidden">
                                {post.thumbnail ? (
                                    <div className="w-full h-full relative bg-gray-100 dark:bg-gray-700">
                                        <Image
                                            src={post.thumbnail}
                                            alt={post.title}
                                            fill
                                            sizes="(max-width: 640px) 80px, 100px"
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

                            {/* コンテンツ部分 - レスポンシブパディング */}
                            <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between overflow-hidden">
                                <div className="overflow-hidden">
                                    <div 
                                        id={`post-meta-${post.id}`}
                                        className="flex items-center justify-between mb-1"
                                    >
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <span aria-hidden="true">{icon}</span>
                                            <time dateTime={post.date}>{formatDate(post.date)}</time>
                                            {/* カテゴリーバッジ */}
                                            {post.category && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                    {post.category}
                                                </span>
                                            )}
                                        </div>
                                        <div 
                                            id={`post-stats-${post.id}`}
                                            className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                                            aria-label="投稿の統計情報"
                                        >
                                            {/* エンゲージメント指標 */}
                                            {post.likes && (
                                                <span className="flex items-center gap-1">
                                                    <span>❤️</span>
                                                    {post.likes}
                                                </span>
                                            )}
                                            {post.stars && (
                                                <span className="flex items-center gap-1">
                                                    <span>⭐</span>
                                                    {post.stars}
                                                </span>
                                            )}
                                            {post.comments && (
                                                <span className="flex items-center gap-1">
                                                    <span>💬</span>
                                                    {post.comments}
                                                </span>
                                            )}
                                            {post.description && getReadingTime(post.description)}
                                        </div>
                                    </div>
                                    <h3 
                                        id={`post-title-${post.id}`}
                                        className="text-base font-bold mb-1 text-gray-800 dark:text-white line-clamp-1"
                                    >
                                        <a
                                            href={post.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                            aria-describedby={`post-meta-${post.id} post-stats-${post.id}`}
                                        >
                                            {post.title}
                                        </a>
                                    </h3>
                                    
                                    {/* タグ表示 - モバイルでは省略 */}
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="hidden sm:flex flex-wrap gap-1 mb-1">
                                            {post.tags.slice(0, 3).map((tag, index) => (
                                                <span 
                                                    key={index}
                                                    className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                            {post.tags.length > 3 && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    +{post.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* 説明文 - 展開時のみ表示するモーダルまたはオーバーレイ */}
                                    {expandedPosts[post.id] && (
                                        <div 
                                            id={`modal-${post.id}`}
                                            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                                            onClick={(e) => {
                                                if (e.target === e.currentTarget) {
                                                    togglePostExpansion(post.id);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Escape') {
                                                    togglePostExpansion(post.id);
                                                }
                                            }}
                                        >
                                            <div 
                                                ref={(el) => {
                                                    modalRefs.current[post.id] = el;
                                                }}
                                                className="bg-white dark:bg-gray-800 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                                                role="dialog"
                                                aria-modal="true"
                                                aria-labelledby={`modal-title-${post.id}`}
                                            >
                                                <h3 id={`modal-title-${post.id}`} className="text-xl font-bold mb-4">{post.title}</h3>

                                                {/* 要約表示部分 */}
                                                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700">
                                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">要約</h4>
                                                    {loadingSummary[post.id] ? (
                                                        <div className="animate-pulse">
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 w-3/4 mb-2"></div>
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 w-full mb-2"></div>
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 w-5/6"></div>
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
                                                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
                                                    >
                                                        記事を読む
                                                    </a>
                                                    <button
                                                        ref={(el) => {
                                                            closeButtonRefs.current[post.id] = el;
                                                        }}
                                                        onClick={() => togglePostExpansion(post.id)}
                                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                                        aria-label="閉じる"
                                                    >
                                                        閉じる
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{source}</span>
                                        {/* GitHub固有の情報 */}
                                        {post.platform === "github" && (
                                            <>
                                                {post.language && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                                        {post.language}
                                                    </span>
                                                )}
                                                {post.forks && (
                                                    <span className="flex items-center gap-1">
                                                        <span>🍴</span>
                                                        {post.forks}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {/* Booklog固有の情報 */}
                                        {post.platform === "booklog" && post.rating && (
                                            <div className="flex items-center">
                                                {Array.from({ length: 5 }, (_, i) => (
                                                    <span key={i} className={i < post.rating! ? "text-yellow-400" : "text-gray-300"}>
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => togglePostExpansion(post.id)}
                                        className="inline-flex items-center bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                        aria-label={`${post.title}の要約を表示`}
                                        aria-expanded={expandedPosts[post.id] || false}
                                        aria-controls={`modal-${post.id}`}
                                    >
                                        要約を表示
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
