import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import SpotifyClient from "./SpotifyClient";

export const metadata: Metadata = {
    title: "Spotify - Basecamp",
    description: "最近再生した曲とプレイリスト",
    openGraph: {
        title: "Spotify - Basecamp",
        description: "最近再生した曲とプレイリスト",
    },
};

export default function SpotifyPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="spotify" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Spotify</h1>
                        <p className="text-gray-500 text-sm mt-1">最近再生した曲とプレイリスト</p>
                    </div>

                    {/* Posts */}
                    <SpotifyClient />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
