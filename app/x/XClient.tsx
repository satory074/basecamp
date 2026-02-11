"use client";

import { useState, useEffect } from "react";
import { Tweet } from "react-tweet";
import type { Post } from "../lib/types";

type FilterCategory = "all" | "post" | "like" | "bookmark";

interface XTweet extends Post {
    category?: string;
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

export default function XClient() {
    const [posts, setPosts] = useState<XTweet[]>([]);
    const [filter, setFilter] = useState<FilterCategory>("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchXPosts().then((data) => {
            setPosts(data);
            setLoading(false);
        });
    }, []);

    const filteredPosts = filter === "all"
        ? posts
        : posts.filter((p) => p.category === filter);

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
        <div>
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {(["all", "post", "like", "bookmark"] as FilterCategory[]).map((cat) => {
                    const label = cat === "all" ? "All" : cat === "post" ? "Posts" : cat === "like" ? "Likes" : "Bookmarks";
                    return (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-3 py-1 text-sm border transition-colors ${
                                filter === cat
                                    ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                                    : "border-gray-300 text-gray-600 hover:border-gray-500 dark:border-gray-600 dark:text-gray-400"
                            }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Tweet Cards */}
            <div className="space-y-4">
                {filteredPosts.map((post) => (
                    <div key={post.id} data-theme="light">
                        <Tweet id={getTweetId(post)} />
                    </div>
                ))}
            </div>

            {filteredPosts.length === 0 && (
                <p className="text-gray-500 text-sm mt-4">
                    該当するツイートがありません。
                </p>
            )}
        </div>
    );
}
