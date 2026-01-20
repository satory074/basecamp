import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import HatenabookmarkClient from "./HatenabookmarkClient";

export const metadata: Metadata = {
    title: "Hatena Bookmark - Basecamp",
    description: "ブックマーク履歴",
    openGraph: {
        title: "Hatena Bookmark - Basecamp",
        description: "ブックマーク履歴",
    },
};

export default function HatenabookmarkPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="hatenabookmark" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Hatena Bookmark</h1>
                        <p className="text-gray-500 text-sm mt-1">ブックマーク履歴</p>
                    </div>

                    {/* Posts */}
                    <HatenabookmarkClient />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
