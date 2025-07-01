"use client";

import { useEffect, useState } from "react";
import { Post } from "@/app/lib/types";
import BooklogIcon from "@/app/components/icons/BooklogIcon";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import Link from "next/link";
import Image from "next/image";

export default function BooklogPosts({ limit }: { limit?: number }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPosts() {
            try {
                const response = await fetch("/api/booklog");
                if (!response.ok) {
                    throw new Error("Failed to fetch booklog posts");
                }
                const data = await response.json();
                setPosts(limit ? data.slice(0, limit) : data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }
        fetchPosts();
    }, [limit]);

    if (loading) return <LoadingSkeleton rows={limit || 3} />;
    if (error) return <div className="text-red-500">エラー: {error}</div>;
    if (posts.length === 0) return <div className="text-gray-500">読書記録がありません</div>;

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <Link
                    key={post.id}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                >
                    <div className="bg-white/5 backdrop-blur-sm border border-amber-500/20 rounded-lg p-4 transition-all duration-300 hover:bg-white/10 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10">
                        <div className="flex gap-4">
                            {post.thumbnail && (
                                <div className="flex-shrink-0">
                                    <Image
                                        src={post.thumbnail}
                                        alt={post.title}
                                        width={60}
                                        height={90}
                                        className="rounded shadow-md"
                                        unoptimized={post.thumbnail.includes('booklog.jp')}
                                    />
                                </div>
                            )}
                            <div className="flex-grow">
                                <div className="flex items-start justify-between">
                                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">
                                        {post.title}
                                    </h3>
                                    <BooklogIcon className="w-5 h-5 text-amber-500 flex-shrink-0 ml-2" />
                                </div>
                                {post.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                        {post.description}
                                    </p>
                                )}
                                {post.data && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {post.data.author ? (
                                            <span className="text-xs text-gray-500 dark:text-gray-500">
                                                著者: {String(post.data.author)}
                                            </span>
                                        ) : null}
                                        {post.data.genre ? (
                                            <span className="text-xs text-gray-500 dark:text-gray-500">
                                                ジャンル: {String(post.data.genre)}
                                            </span>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}