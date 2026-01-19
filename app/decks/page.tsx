import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import DecksClient from "./DecksClient";

export const metadata: Metadata = {
    title: "デッキ - Basecamp",
    description: "使用中のツール・サービス一覧",
    openGraph: {
        title: "デッキ - Basecamp",
        description: "使用中のツール・サービス一覧",
    },
};

export default function DecksPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="decks" />

            <main className="main-content">
                <div className="content-wrapper">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Decks
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            使用中のツール・サービス
                        </p>
                    </div>

                    <DecksClient />

                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
