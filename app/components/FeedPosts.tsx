"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Post } from "../lib/types";

interface FeedPostsProps {
    fetchPosts: () => Promise<Post[]>;
    icon: string | React.ReactNode;
    source: string;
}

export default function FeedPosts({ fetchPosts, icon, source }: FeedPostsProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
        ];

        try {
            const hostname = new URL(url).hostname;
            return allowedDomains.some((domain) => hostname.includes(domain));
        } catch {
            return false;
        }
    }

    if (isLoading) {
        return <div className="my-8 p-4 text-center">Loading {source} posts...</div>;
    }

    if (posts.length === 0) {
        return <div className="my-8 p-4 text-center">No {source} posts found</div>;
    }

    return (
        <div className="my-8">
            <div className="grid gap-6">
                {posts.slice(0, 5).map((post) => (
                    <article
                        key={post.id}
                        className="bg-white dark:bg-gray-800 border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                    >
                        <a href={post.url} target="_blank" rel="noopener noreferrer" className="block h-full">
                            <div className="flex flex-col md:flex-row h-full">
                                {/* サムネイル部分 - 固定高さと幅で一貫したサイズに */}
                                <div className="md:w-1/3 h-48 md:h-auto relative flex-shrink-0 overflow-hidden">
                                    {post.thumbnail ? (
                                        <div className="w-full h-full relative bg-gray-100 dark:bg-gray-700">
                                            {isAllowedImageDomain(post.thumbnail) ? (
                                                <Image
                                                    src={post.thumbnail}
                                                    alt={post.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 33vw"
                                                    className="object-cover transition-transform duration-300 hover:scale-105"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <img
                                                    src={post.thumbnail}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = "none";
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        // サムネイルがない場合のプレースホルダー
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                            <div className="text-4xl text-gray-400 dark:text-gray-500">{icon}</div>
                                        </div>
                                    )}
                                </div>

                                {/* コンテンツ部分 */}
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <span>{icon}</span>
                                                <time dateTime={post.date}>{formatDate(post.date)}</time>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {post.description && getReadingTime(post.description)}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white line-clamp-2">
                                            {post.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">
                                            {post.description || post.data?.description || ""}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <div className="text-sm text-gray-500">{source}</div>
                                        <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                                            Read more
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </article>
                ))}
            </div>
        </div>
    );
}
