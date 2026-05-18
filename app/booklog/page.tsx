import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import ExternalProfileLink from "../components/shared/ExternalProfileLink";
import BooklogClient from "./BooklogClient";
import { getBooklogPosts } from "../lib/feeds/booklog";

export const metadata: Metadata = {
    title: "読書記録 - Basecamp",
    description: "Booklog読書記録",
    openGraph: {
        title: "読書記録 - Basecamp",
        description: "Booklog読書記録",
    },
};

export default async function BooklogPage() {
    const posts = await getBooklogPosts();
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
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Booklog</h1>
                            <ExternalProfileLink platform="booklog" platformLabel="Booklog" />
                        </div>
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
