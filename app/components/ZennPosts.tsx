"use client";

import { useEffect, useState } from "react";
import { getZennPosts } from "../lib/posts";
import type { Post } from "../lib/types";

export default function ZennPosts() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const fetchedPosts = await getZennPosts();
                setPosts(fetchedPosts as Post[]);
            } catch (error) {
                console.error("Failed to fetch Zenn posts:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPosts();
    }, []);

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="mb-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Latest Zenn Posts</h2>
            <div className="space-y-4">
                {posts.map((post) => (
                    <article key={post.id} className="border-b pb-4">
                        <a
                            href={post.data.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:bg-gray-50 p-2 rounded"
                        >
                            <h3 className="text-xl font-semibold text-blue-600 hover:underline">{post.data.title}</h3>
                            <time className="text-sm text-gray-500" suppressHydrationWarning>
                                {new Date(post.data.pubdate).toLocaleDateString("ja-JP")}
                            </time>
                            {post.data.description && <p className="mt-2 text-gray-600">{post.data.description}</p>}
                        </a>
                    </article>
                ))}
            </div>
        </div>
    );
}
