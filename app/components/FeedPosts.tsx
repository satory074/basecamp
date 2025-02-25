"use client";

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

    if (isLoading) {
        return <div>Loading {source} posts...</div>;
    }

    return (
        <div className="my-8">
            <div className="space-y-4">
                {posts.slice(0, 5).map((post) => (
                    <article key={post.id} className="border-b pb-4">
                        <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:bg-gray-50 dark:hover:bg-gray-800 p-4 rounded-lg transition"
                        >
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <span>{icon}</span>
                                <time dateTime={post.date}>{formatDate(post.date)}</time>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                            {post.data?.description && (
                                <p className="text-gray-600 dark:text-gray-400">{post.data.description}</p>
                            )}
                        </a>
                    </article>
                ))}
            </div>
        </div>
    );
}
