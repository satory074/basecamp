import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import DiaryClient from "./DiaryClient";

export const metadata: Metadata = {
    title: "日記 - Basecamp",
    description: "AI生成の日記",
    openGraph: {
        title: "日記 - Basecamp",
        description: "AI生成の日記",
    },
};

export default function DiaryPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="diary" />

            <div className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">日記</h1>
                        <p className="text-gray-500 text-sm mt-1">AI生成の日記</p>
                    </div>

                    {/* Posts */}
                    <DiaryClient />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
