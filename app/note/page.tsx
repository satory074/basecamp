"use client";

import Sidebar from "../components/Sidebar";
import FeedPosts from "../components/FeedPosts";
import { getNotePosts } from "../lib/posts";

export default function NotePage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="note" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Note</h1>
                        <p className="text-gray-500 text-sm mt-1">クリエイターとしての発信</p>
                    </div>

                    {/* Posts */}
                    <FeedPosts
                        fetchPosts={getNotePosts}
                        source="Note"
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
