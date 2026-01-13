"use client";

import { useCallback, useEffect, useState } from "react";
import type { Post } from "../lib/types";

interface FeedPostsProps {
    fetchPosts: () => Promise<Post[]>;
    icon?: string | React.ReactNode;
    source: string;
    limit?: number;
}

export default function FeedPosts({ fetchPosts, source, limit = 10 }: FeedPostsProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const data = await fetchPosts();
        setPosts(data.slice(0, limit));
        setIsLoading(false);
    }, [fetchPosts, limit]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";
            return date.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit" }).replace("/", ".");
        } catch {
            return "";
        }
    };

    if (isLoading) {
        return (
            <div className="py-12 text-center text-gray-500">
                Loading {source} posts...
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="py-12 text-center text-gray-500">
                No posts found.
            </div>
        );
    }

    return (
        <div>
            {posts.map((post, index) => (
                <a
                    key={post.id}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="list-item group"
                >
                    <span className="list-item-number">
                        {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="list-item-title line-clamp-1">
                        {post.title}
                    </span>
                    <span className="list-item-meta">
                        <span className="hide-mobile">{source}</span>
                        <span>{formatDate(post.date)}</span>
                        <span className="list-item-arrow">→</span>
                    </span>
                </a>
            ))}
        </div>
    );
}
