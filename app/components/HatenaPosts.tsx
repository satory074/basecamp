"use client";

import { useEffect, useState } from "react";
import { getHatenaPosts } from "../lib/posts";
import type { Post } from "../lib/types";

export default function HatenaPosts() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            const data = await getHatenaPosts();
            setPosts(data);
            setIsLoading(false);
        };
        fetchPosts();
    }, []);

    if (isLoading) {
        return <div>Loading Hatena posts...</div>;
    }

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Latest Hatena Blog Posts</h2>
            <ul className="space-y-4">
                {posts.map((post) => (
                    <li key={post.id}>
                        <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-md transition-shadow"
                        >
                            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300">{post.date}</p>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
