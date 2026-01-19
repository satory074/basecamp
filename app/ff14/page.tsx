import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import FF14Client from "./FF14Client";

export const metadata: Metadata = {
    title: "FF14 - Basecamp",
    description: "ファイナルファンタジーXIV キャラクター情報",
    openGraph: {
        title: "FF14 - Basecamp",
        description: "ファイナルファンタジーXIV キャラクター情報",
    },
};

export default function FF14Page() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="ff14" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">FF14</h1>
                        <p className="text-gray-500 text-sm mt-1">ファイナルファンタジーXIV</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <a
                                href="https://jp.finalfantasyxiv.com/lodestone/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="platform-tag"
                            >
                                Lodestone
                            </a>
                            <a
                                href="https://jp.finalfantasyxiv.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="platform-tag"
                            >
                                公式サイト
                            </a>
                        </div>
                    </div>

                    {/* Character Info */}
                    <FF14Client />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
