"use client";

import Sidebar from "../components/Sidebar";
import FeedPosts from "../components/FeedPosts";
import { getGithubPosts } from "../lib/posts";

export default function GitHubPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="github" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">GitHub</h1>
                        <p className="text-gray-500 text-sm mt-1">オープンソースプロジェクト</p>
                    </div>

                    {/* Posts */}
                    <FeedPosts
                        fetchPosts={getGithubPosts}
                        source="GitHub"
                    />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
