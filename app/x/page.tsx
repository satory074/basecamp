import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import XClient from "./XClient";

export const metadata: Metadata = {
    title: "X - Basecamp",
    description: "ツイート",
    openGraph: {
        title: "X - Basecamp",
        description: "ツイート",
    },
};

export default function XPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="x" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">X</h1>
                        <p className="text-gray-500 text-sm mt-1">ツイート</p>
                    </div>

                    {/* Posts */}
                    <XClient />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
