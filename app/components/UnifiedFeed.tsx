"use client";

import { useEffect, useState } from "react";
import { getUnifiedPosts } from "../lib/posts";
import type { UnifiedPost } from "../lib/types";

export default function UnifiedFeed() {
    const [posts, setPosts] = useState<UnifiedPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            const data = await getUnifiedPosts();
            setPosts(data);
            setIsLoading(false);
        };

        fetchPosts();
    }, []);

    if (isLoading) {
        return <div>Loading posts...</div>;
    }

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case "zenn":
                return "📘";
            case "hatena":
                return "📝";
            default:
                return "📄";
        }
    };

    return (
        <div className="my-8">
            <h2 className="text-2xl font-bold mb-4">Latest Posts</h2>
            <div className="space-y-4">
                {posts.map((post) => (
                    <article key={post.id} className="border-b pb-4">
                        <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:bg-gray-50 dark:hover:bg-gray-800 p-4 rounded-lg transition"
                        >
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <span>{getPlatformIcon(post.platform)}</span>
                                <time dateTime={post.date.toISOString()}>{post.date.toLocaleDateString("ja-JP")}</time>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                            {post.description && <p className="text-gray-600 dark:text-gray-400">{post.description}</p>}
                        </a>
                    </article>
                ))}
            </div>
        </div>
    );
}
