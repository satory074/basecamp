"use client";

import Sidebar from "../components/Sidebar";
import FeedPosts from "../components/FeedPosts";
import type { Post } from "../lib/types";

async function fetchFilmarksPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/filmarks");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

export default function FilmarksPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="filmarks" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Filmarks</h1>
                        <p className="text-gray-500 text-sm mt-1">映画・ドラマ視聴記録</p>
                    </div>

                    {/* Posts */}
                    <FeedPosts
                        fetchPosts={fetchFilmarksPosts}
                        source="Filmarks"
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
