"use client";

import Sidebar from "../components/Sidebar";
import dynamic from "next/dynamic";

const FF14Character = dynamic(() => import("@/app/components/FF14Character"), {
    ssr: false,
    loading: () => <div className="py-12 text-center text-gray-500">Loading...</div>
});

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
                    <FF14Character />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
