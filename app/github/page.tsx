import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import GithubClient from "./GithubClient";

export const metadata: Metadata = {
    title: "GitHub - Basecamp",
    description: "オープンソースプロジェクト・リポジトリ一覧",
    openGraph: {
        title: "GitHub - Basecamp",
        description: "オープンソースプロジェクト・リポジトリ一覧",
    },
};

export default function GitHubPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="github" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">GitHub</h1>
                        <p className="text-gray-500 text-sm mt-1">オープンソースプロジェクト</p>
                    </div>

                    {/* Posts */}
                    <GithubClient />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
