import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import TenhouClient from "./TenhouClient";

export const metadata: Metadata = {
    title: "天鳳 - Basecamp",
    description: "天鳳戦績・麻雀統計データ",
    openGraph: {
        title: "天鳳 - Basecamp",
        description: "天鳳戦績・麻雀統計データ",
    },
};

export default function TenhouPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="tenhou" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Tenhou</h1>
                        <p className="text-gray-500 text-sm mt-1">天鳳戦績</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <a
                                href="https://tenhou.net/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="platform-tag"
                            >
                                天鳳で対戦
                            </a>
                            <a
                                href="https://nodocchi.moe/tenhoulog/?name=Unbobo"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="platform-tag"
                            >
                                詳細統計
                            </a>
                        </div>
                    </div>

                    {/* Stats */}
                    <TenhouClient />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
