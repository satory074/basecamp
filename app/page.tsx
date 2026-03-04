import { headers } from "next/headers";
import HomeSidebar from "./components/HomeSidebar";
import HomeFeed from "./components/HomeFeed";
import { Post } from "./lib/types";
import { TenhouMatch } from "./lib/tenhou-types";

export const dynamic = "force-dynamic";

interface FetchResult<T> {
    data: T;
    error: string | null;
}

async function getBaseUrl(): Promise<string> {
    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host");

    if (!host) {
        throw new Error("Host header is missing");
    }

    const protocol =
        headersList.get("x-forwarded-proto") ||
        (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

    return `${protocol}://${host}`;
}

async function fetchEndpoint<T>(baseUrl: string, endpoint: string, source: string, fallback: T): Promise<FetchResult<T>> {
    try {
        const response = await fetch(`${baseUrl}${endpoint}`, { next: { revalidate: 21600 } });

        if (!response.ok) {
            let detail = `HTTP ${response.status}`;
            try {
                const body = (await response.json()) as {
                    error?: { message?: string } | string;
                };

                if (typeof body.error === "string") {
                    detail = body.error;
                } else if (body.error?.message) {
                    detail = body.error.message;
                }
            } catch {
                // Use status fallback when response body isn't JSON.
            }

            return { data: fallback, error: `${source}: ${detail}` };
        }

        const data = (await response.json()) as T;
        return { data, error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { data: fallback, error: `${source}: ${message}` };
    }
}

async function fetchPosts() {
    try {
        const baseUrl = await getBaseUrl();

        const [hatenaRes, zennRes, booklogRes, noteRes, filmarksRes, spotifyRes, hatenabookmarkRes, ff14AchievementsRes, tenhouRes, xRes, duolingoRes, steamRes] =
            await Promise.all([
                fetchEndpoint<Post[]>(baseUrl, "/api/hatena", "Hatena", []),
                fetchEndpoint<Post[]>(baseUrl, "/api/zenn", "Zenn", []),
                fetchEndpoint<Post[]>(baseUrl, "/api/booklog", "Booklog", []),
                fetchEndpoint<Post[]>(baseUrl, "/api/note", "Note", []),
                fetchEndpoint<Post[]>(baseUrl, "/api/filmarks", "Filmarks", []),
                fetchEndpoint<Post[]>(baseUrl, "/api/spotify", "Spotify", []),
                fetchEndpoint<Post[]>(baseUrl, "/api/hatenabookmark", "Hatena Bookmark", []),
                fetchEndpoint<Post[]>(baseUrl, "/api/ff14-achievements", "FF14 Achievements", []),
                fetchEndpoint<{ recentMatches?: TenhouMatch[] } | null>(baseUrl, "/api/tenhou", "Tenhou", null),
                fetchEndpoint<Post[]>(baseUrl, "/api/x", "X", []),
                fetchEndpoint<Post[]>(baseUrl, "/api/duolingo", "Duolingo", []),
                fetchEndpoint<Post[]>(baseUrl, "/api/steam", "Steam", []),
            ]);

        const tenhouPosts =
            tenhouRes.data?.recentMatches?.map((match: TenhouMatch) => ({
                id: `tenhou-${match.date}-${match.position}`,
                title: `${match.position}位`,
                url: "https://tenhou.net/",
                date: match.date,
                platform: "tenhou",
                description: `${match.roomType} ${match.score > 0 ? "+" : ""}${match.score}点`,
            })) || [];

        const allPosts = [
            ...hatenaRes.data.map((p: Post) => ({ ...p, platform: "hatena" })),
            ...zennRes.data.map((p: Post) => ({ ...p, platform: "zenn" })),
            ...booklogRes.data.map((p: Post) => ({ ...p, platform: "booklog" })),
            ...noteRes.data.map((p: Post) => ({ ...p, platform: "note" })),
            ...filmarksRes.data.map((p: Post) => ({ ...p, platform: "filmarks" })),
            ...spotifyRes.data.map((p: Post) => ({ ...p, platform: "spotify" })),
            ...hatenabookmarkRes.data.map((p: Post) => ({ ...p, platform: "hatenabookmark" })),
            ...ff14AchievementsRes.data.map((p: Post) => ({ ...p, platform: "ff14-achievement" })),
            ...tenhouPosts,
            ...xRes.data.map((p: Post) => ({ ...p, platform: "x" })),
            ...duolingoRes.data.map((p: Post) => ({ ...p, platform: "duolingo" })),
            ...steamRes.data.map((p: Post) => ({ ...p, platform: "steam" })),
        ];

        allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const errors = [
            hatenaRes.error,
            zennRes.error,
            booklogRes.error,
            noteRes.error,
            filmarksRes.error,
            spotifyRes.error,
            hatenabookmarkRes.error,
            ff14AchievementsRes.error,
            tenhouRes.error,
            xRes.error,
            duolingoRes.error,
            steamRes.error,
        ].filter((value): value is string => Boolean(value));

        return {
            posts: allPosts,
            stats: {
                posts: hatenaRes.data.length + zennRes.data.length + noteRes.data.length,
                books: booklogRes.data.length,
            },
            errors,
        };
    } catch (error) {
        console.error("Failed to fetch content:", error);
        return {
            posts: [],
            stats: { posts: 0, books: 0 },
            errors: ["ホームデータの取得に失敗しました"],
        };
    }
}

export default async function Home() {
    const { posts, stats, errors } = await fetchPosts();

    return (
        <div className="split-layout">
            <HomeSidebar stats={stats} />

            <main className="main-content">
                <div className="content-wrapper">
                    <h2 className="section-title">Recent Posts</h2>

                    {errors.length > 0 && (
                        <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            一部のデータ取得に失敗しました: {errors.join(" / ")}
                        </p>
                    )}

                    <HomeFeed initialPosts={posts} />

                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
