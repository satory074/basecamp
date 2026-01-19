import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import FilmarksClient from "./FilmarksClient";
import type { Post } from "../lib/types";

export const metadata: Metadata = {
    title: "視聴記録 - Basecamp",
    description: "映画・ドラマ・アニメ視聴記録",
    openGraph: {
        title: "視聴記録 - Basecamp",
        description: "映画・ドラマ・アニメ視聴記録",
    },
};

const HIGH_RATING_THRESHOLD = 4.5;

// サーバーサイドでのデータ取得
async function fetchFilmarksPostsServer(): Promise<Post[]> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    try {
        const response = await fetch(`${baseUrl}/api/filmarks`, {
            next: { revalidate: 21600 },
        });
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

export default async function FilmarksPage() {
    // サーバーサイドでデータ取得
    const posts = await fetchFilmarksPostsServer();

    // 高評価作品のフィルタリング・ソート
    const filtered = posts.filter(
        (post) => post.rating !== undefined && post.rating >= HIGH_RATING_THRESHOLD
    );
    filtered.sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // カテゴリ別に分類
    const highRatedMovies = filtered.filter((p) => p.description === "映画");
    const highRatedDramas = filtered.filter((p) => p.description === "ドラマ");
    const highRatedAnimes = filtered.filter((p) => p.description === "アニメ");

    return (
        <div className="split-layout">
            <Sidebar activePlatform="filmarks" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Filmarks</h1>
                        <p className="text-gray-500 text-sm mt-1">映画・ドラマ・アニメ視聴記録</p>
                    </div>

                    {/* Client Component for high-rated sections and feed */}
                    <FilmarksClient
                        highRatedMovies={highRatedMovies}
                        highRatedDramas={highRatedDramas}
                        highRatedAnimes={highRatedAnimes}
                    />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
