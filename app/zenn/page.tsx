import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import ZennClient from "./ZennClient";

export const metadata: Metadata = {
    title: "Zenn - Basecamp",
    description: "技術記事とチュートリアル",
    openGraph: {
        title: "Zenn - Basecamp",
        description: "技術記事とチュートリアル",
    },
};

export default function ZennPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="zenn" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Zenn</h1>
                        <p className="text-gray-500 text-sm mt-1">技術記事とチュートリアル</p>
                    </div>

                    {/* Posts */}
                    <ZennClient />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
