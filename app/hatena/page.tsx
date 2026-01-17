"use client";

import Sidebar from "../components/Sidebar";
import FeedPosts from "../components/FeedPosts";
import { getHatenaPosts } from "../lib/posts";

export default function HatenaPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="hatena" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Hatena Blog</h1>
                        <p className="text-gray-500 text-sm mt-1">技術記事とエッセイ</p>
                    </div>

                    {/* Posts */}
                    <FeedPosts
                        fetchPosts={getHatenaPosts}
                        source="Hatena"
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
