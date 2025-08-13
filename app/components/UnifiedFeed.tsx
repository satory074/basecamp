"use client";

import { useEffect, useState, useMemo } from "react";
import type { FormattedPost } from "../lib/types";
import { fetchAllPosts } from "../lib/api";
import { GithubIcon, HatenaIcon } from "./icons";
import SearchBar from "./SearchBar";
import LoadingSkeleton from "./LoadingSkeleton";

export default function UnifiedFeed() {
    const [posts, setPosts] = useState<FormattedPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

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

    // 検索とフィルタリングのロジック
    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            // プラットフォームフィルタ
            if (selectedPlatform !== "all" && post.platform !== selectedPlatform) {
                return false;
            }
            
            // 検索クエリフィルタ
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    post.title.toLowerCase().includes(query) ||
                    (post.description && post.description.toLowerCase().includes(query))
                );
            }
            
            return true;
        });
    }, [posts, searchQuery, selectedPlatform]);

    if (isLoading) {
        return (
            <div className="my-8">
                <h2 className="text-2xl font-bold mb-6">最近のアクティビティ</h2>
                <LoadingSkeleton rows={5} />
            </div>
        );
    }

    if (error) {
        return <div className="my-8 p-4 text-center text-red-500">Error: {error}</div>;
    }

    return (
        <div className="my-8">
            <h2 className="text-2xl font-bold mb-6">最近のアクティビティ</h2>
            
            {/* 検索とフィルター */}
            <div className="mb-6 space-y-4">
                <SearchBar onSearch={setSearchQuery} />
                
                {/* プラットフォームフィルター */}
                <div className="flex gap-2 justify-center flex-wrap">
                    <button
                        onClick={() => setSelectedPlatform("all")}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            selectedPlatform === "all"
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                    >
                        すべて
                    </button>
                    <button
                        onClick={() => setSelectedPlatform("github")}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            selectedPlatform === "github"
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                    >
                        GitHub
                    </button>
                    <button
                        onClick={() => setSelectedPlatform("hatena")}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            selectedPlatform === "hatena"
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                    >
                        はてなブログ
                    </button>
                    <button
                        onClick={() => setSelectedPlatform("zenn")}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            selectedPlatform === "zenn"
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                    >
                        Zenn
                    </button>
                </div>
            </div>
            
            {/* 検索結果の件数表示 */}
            {(searchQuery || selectedPlatform !== "all") && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {filteredPosts.length}件の投稿が見つかりました
                </p>
            )}
            
            <div className="space-y-4">
                {filteredPosts.map((post) => (
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
