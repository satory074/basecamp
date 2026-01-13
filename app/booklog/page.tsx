"use client";

import Sidebar from "../components/Sidebar";
import dynamic from "next/dynamic";

const BooklogPosts = dynamic(() => import("@/app/components/BooklogPosts"), {
    ssr: false,
    loading: () => <div className="py-12 text-center text-gray-500">Loading...</div>
});

export default function BooklogPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="booklog" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Booklog</h1>
                        <p className="text-gray-500 text-sm mt-1">読書記録</p>
                    </div>

                    {/* Books */}
                    <BooklogPosts />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
