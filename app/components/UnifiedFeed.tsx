"use client";

import { useEffect, useState } from "react";
import type { Post, FormattedPost } from "../lib/types";
import { fetchAllPosts } from "../lib/api";
import { GithubIcon, HatenaIcon } from "./icons";

export default function UnifiedFeed() {
    const [posts, setPosts] = useState<FormattedPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadPosts() {
            try {
                const { data, error } = await fetchAllPosts();

                if (error) {
                    setError(error);
                    return;
                }

                if (!data) {
                    setError("No data returned");
                    return;
                }

                // 投稿を整形して表示用に変換
                const formattedPosts: FormattedPost[] = data.map(post => {
                    let iconComponent;

                    switch (post.platform) {
                        case "github":
                            iconComponent = <GithubIcon size={20} />;
                            break;
                        case "hatena":
                            iconComponent = <HatenaIcon size={20} />;
                            break;
                        case "zenn":
                            iconComponent = <div className="text-xl">📘</div>;
                            break;
                    }

                    return {
                        ...post,
                        date: new Date(post.date),
                        iconComponent
                    };
                });

                setPosts(formattedPosts);
            } catch (err) {
                setError("Failed to load posts");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }

        loadPosts();
    }, []);

    if (isLoading) {
        return <div className="my-8 p-4 text-center">Loading posts...</div>;
    }

    if (error) {
        return <div className="my-8 p-4 text-center text-red-500">Error: {error}</div>;
    }

    return (
        <div className="my-8">
            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
            <div className="space-y-4">
                {posts.map((post) => (
                    <article key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-gray-600 dark:text-gray-400">
                                    {post.iconComponent}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    {post.platform.toUpperCase()}
                                </span>
                                <time dateTime={post.date.toISOString()} className="text-sm text-gray-600 dark:text-gray-400">
                                    {post.date.toLocaleDateString("ja-JP")}
                                </time>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                            {post.description && (
                                <p className="text-gray-600 dark:text-gray-400">{post.description}</p>
                            )}
                        </a>
                    </article>
                ))}
            </div>
        </div>
    );
}
