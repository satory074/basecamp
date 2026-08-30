import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import DiaryClient from "./DiaryClient";

export const metadata: Metadata = {
    title: "日記 - Basecamp",
    description: "各サービスの活動を 1 日 1 枚にまとめたデイリーログ",
    openGraph: {
        title: "日記 - Basecamp",
        description: "各サービスの活動を 1 日 1 枚にまとめたデイリーログ",
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
                        <p className="text-gray-500 text-sm mt-1">
                            各サービスの活動を 1 日 1 枚にまとめたデイリーログ (見出しと導入文のみ AI が要約)
                        </p>
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
