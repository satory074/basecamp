import HomeSidebar from "./components/HomeSidebar";
import HomeFeed from "./components/HomeFeed";
import { Post } from "./lib/types";

// リクエスト時にデータ取得（AWS Amplifyでの安定動作のため）
export const dynamic = "force-dynamic";

// データ取得関数
async function fetchPosts() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    try {
        // X は埋め込みウィジェットを使用するためAPIフェッチから除外
        const [hatenaRes, zennRes, booklogRes, noteRes, filmarksRes, spotifyRes, hatenabookmarkRes, ff14AchievementsRes] = await Promise.all([
            fetch(`${baseUrl}/api/hatena`, { next: { revalidate: 21600 } }).then(r => r.json()).catch(() => []),
            fetch(`${baseUrl}/api/zenn`, { next: { revalidate: 21600 } }).then(r => r.json()).catch(() => []),
            fetch(`${baseUrl}/api/booklog`, { next: { revalidate: 21600 } }).then(r => r.json()).catch(() => []),
            fetch(`${baseUrl}/api/note`, { next: { revalidate: 21600 } }).then(r => r.json()).catch(() => []),
            fetch(`${baseUrl}/api/filmarks`, { next: { revalidate: 21600 } }).then(r => r.json()).catch(() => []),
            fetch(`${baseUrl}/api/spotify`, { next: { revalidate: 21600 } }).then(r => r.json()).catch(() => []),
            fetch(`${baseUrl}/api/hatenabookmark`, { next: { revalidate: 21600 } }).then(r => r.json()).catch(() => []),
            fetch(`${baseUrl}/api/ff14-achievements`, { next: { revalidate: 21600 } }).then(r => r.json()).catch(() => []),
        ]);

        const allPosts = [
            ...hatenaRes.map((p: Post) => ({ ...p, platform: "hatena" })),
            ...zennRes.map((p: Post) => ({ ...p, platform: "zenn" })),
            ...booklogRes
                .filter((p: Post) => p.description !== "読みたい")
                .map((p: Post) => ({ ...p, platform: "booklog" })),
            ...noteRes.map((p: Post) => ({ ...p, platform: "note" })),
            ...filmarksRes.map((p: Post) => ({ ...p, platform: "filmarks" })),
            ...spotifyRes.map((p: Post) => ({ ...p, platform: "spotify" })),
            ...hatenabookmarkRes.map((p: Post) => ({ ...p, platform: "hatenabookmark" })),
            ...ff14AchievementsRes.map((p: Post) => ({ ...p, platform: "ff14-achievement" })),
        ];

        // Sort by date, newest first
        allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            posts: allPosts,
            stats: {
                posts: (hatenaRes.length || 0) + (zennRes.length || 0) + (noteRes.length || 0),
                books: booklogRes.length || 0,
            },
        };
    } catch (error) {
        console.error("Failed to fetch content:", error);
        return {
            posts: [],
            stats: { posts: 0, books: 0 },
        };
    }
}

export default async function Home() {
    const { posts, stats } = await fetchPosts();

    return (
        <div className="split-layout">
            <HomeSidebar stats={stats} />

            <main className="main-content">
                <div className="content-wrapper">
                    <h2 className="section-title">Recent Posts</h2>

                    <HomeFeed initialPosts={posts} />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
