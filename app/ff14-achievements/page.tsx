import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import FF14AchievementsClient from "./FF14AchievementsClient";

export const metadata: Metadata = {
    title: "FF14 アチーブメント - Basecamp",
    description: "FF14 取得済みアチーブメント一覧",
    openGraph: {
        title: "FF14 アチーブメント - Basecamp",
        description: "FF14 取得済みアチーブメント一覧",
    },
};

export default function FF14AchievementsPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="ff14" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">FF14 Achievements</h1>
                        <p className="text-gray-500 text-sm mt-1">取得済みアチーブメント一覧</p>
                    </div>

                    {/* Achievements Feed */}
                    <FF14AchievementsClient />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
