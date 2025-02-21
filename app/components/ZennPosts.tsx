"use client";

import { useEffect, useState } from "react";
import { getZennPosts } from "../lib/posts";
import type { Post } from "../lib/types";

export default function ZennPosts() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            const data = await getZennPosts();
            setPosts(data);
            setIsLoading(false);
        };

        fetchPosts();
    }, []);

    if (isLoading) {
        return (
            <div className="my-8">
                <h2 className="text-2xl font-bold mb-4">Zenn Posts</h2>
                <p>Loading...</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="my-8">
                <h2 className="text-2xl font-bold mb-4">Zenn Posts</h2>
                <p>No posts found.</p>
            </div>
        );
    }

    return (
        <div className="my-8">
            <h2 className="text-2xl font-bold mb-4">Zenn Posts</h2>
            <div className="space-y-4">
                {posts.map((post) => (
                    <article key={post.id} className="border-b pb-4">
                        <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:bg-gray-50 p-2 rounded"
                        >
                            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300">{post.date}</p>
                        </a>
                    </article>
                ))}
            </div>
        </div>
    );
}
