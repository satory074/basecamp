import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import BooklogClient from "./BooklogClient";

export const metadata: Metadata = {
    title: "読書記録 - Basecamp",
    description: "Booklog読書記録",
    openGraph: {
        title: "読書記録 - Basecamp",
        description: "Booklog読書記録",
    },
};

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
                    <BooklogClient />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
