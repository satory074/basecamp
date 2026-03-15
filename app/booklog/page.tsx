import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import BooklogClient from "./BooklogClient";
import type { Post } from "../lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "読書記録 - Basecamp",
    description: "Booklog読書記録",
    openGraph: {
        title: "読書記録 - Basecamp",
        description: "Booklog読書記録",
    },
};

async function fetchBooklogPostsServer(): Promise<Post[]> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    try {
        const response = await fetch(`${baseUrl}/api/booklog`, { cache: "no-store" });
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

export default async function BooklogPage() {
    const posts = await fetchBooklogPostsServer();
    const highRatedBooks = posts
        .filter((p) => p.rating === 5)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="split-layout">
            <Sidebar activePlatform="booklog" />

            <div className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Booklog</h1>
                        <p className="text-gray-500 text-sm mt-1">読書記録</p>
                    </div>

                    {/* Books */}
                    <BooklogClient highRatedBooks={highRatedBooks} />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
