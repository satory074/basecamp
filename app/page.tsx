import HomeSidebar from "./components/HomeSidebar";
import HomeFeed from "./components/HomeFeed";
import { Post } from "./lib/types";

// ビルド時の静的生成をスキップし、リクエスト時にデータ取得
export const dynamic = "force-dynamic";

// データ取得関数
async function fetchPosts() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    try {
        const [hatenaRes, zennRes, booklogRes, noteRes, filmarksRes] = await Promise.all([
            fetch(`${baseUrl}/api/hatena`, { next: { revalidate: 3600 } }).then(r => r.json()).catch(() => []),
            fetch(`${baseUrl}/api/zenn`, { next: { revalidate: 3600 } }).then(r => r.json()).catch(() => []),
            fetch(`${baseUrl}/api/booklog`, { next: { revalidate: 3600 } }).then(r => r.json()).catch(() => []),
            fetch(`${baseUrl}/api/note`, { next: { revalidate: 3600 } }).then(r => r.json()).catch(() => []),
            fetch(`${baseUrl}/api/filmarks`, { next: { revalidate: 3600 } }).then(r => r.json()).catch(() => []),
        ]);

        const allPosts = [
            ...hatenaRes.map((p: Post) => ({ ...p, platform: "hatena" })),
            ...zennRes.map((p: Post) => ({ ...p, platform: "zenn" })),
            ...booklogRes.map((p: Post) => ({ ...p, platform: "booklog" })),
            ...noteRes.map((p: Post) => ({ ...p, platform: "note" })),
            ...filmarksRes.map((p: Post) => ({ ...p, platform: "filmarks" })),
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
