"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FeedPosts from "../components/FeedPosts";
import Sidebar from "../components/Sidebar";
import { getGithubPosts } from "../lib/posts";
import type { Post } from "../lib/types";

export default function GitHubPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadPosts() {
            const data = await getGithubPosts();
            setPosts(data);
            setIsLoading(false);
        }

        loadPosts();
    }, []);

    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-wrap -mx-4">
                <main className="w-full lg:w-3/4 px-4">
                    <div className="mb-6">
                        <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                            <span>←</span> Back to Home
                        </Link>
                    </div>

                    <h1 className="text-3xl font-bold mb-6">GitHub Repositories</h1>

                    {isLoading ? (
                        <div className="my-8 p-4 text-center">Loading GitHub repositories...</div>
                    ) : (
                        <FeedPosts
                            fetchPosts={() => Promise.resolve(posts)}
                            icon="GitHub"
                            source="GitHub"
                            limit={50} // 表示件数を増やす
                        />
                    )}
                </main>

                <aside className="w-full lg:w-1/4 px-4">
                    <Sidebar />
                </aside>
            </div>
        </div>
    );
}
