import HomeSidebar from "./components/HomeSidebar";
import HomeFeed from "./components/HomeFeed";
import { Post } from "./lib/types";
import { TenhouMatch } from "./lib/tenhou-types";
import * as fs from "fs";
import * as path from "path";

export const revalidate = 300; // ISR: 5分間キャッシュ

interface ContentItem extends Post {
    platform: string;
}

/** 同一プラットフォームの連続投稿を最大 maxConsecutive 件に制限する */
function balancePosts(posts: ContentItem[], maxConsecutive = 2): ContentItem[] {
    const result: ContentItem[] = [];
    const deferred: ContentItem[] = [];

    function countTrailingPlatform(arr: ContentItem[], platform: string): number {
        let count = 0;
        for (let i = arr.length - 1; i >= 0; i--) {
            if (arr[i].platform === platform) count++;
            else break;
        }
        return count;
    }

    for (const post of posts) {
        const consecutiveCount = countTrailingPlatform(result, post.platform);

        if (consecutiveCount >= maxConsecutive) {
            deferred.push(post);
        } else {
            // 挿入前に、異なるプラットフォームのdeferred投稿を1件挿入
            if (deferred.length > 0) {
                const deferredIdx = deferred.findIndex(d => d.platform !== post.platform);
                if (deferredIdx >= 0) {
                    result.push(deferred.splice(deferredIdx, 1)[0]);
                }
            }
            result.push(post);
        }
    }
    result.push(...deferred);
    return result;
}

interface FetchResult<T> {
    data: T;
    error: string | null;
}

function getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

const FETCH_ENDPOINT_TIMEOUT = 15000; // 15秒タイムアウト

async function fetchEndpoint<T>(baseUrl: string, endpoint: string, source: string, fallback: T): Promise<FetchResult<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_ENDPOINT_TIMEOUT);

    try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            next: { revalidate: 21600 },
            signal: controller.signal,
        });

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
        const message = error instanceof Error
            ? (error.name === "AbortError" ? "Timeout (15s)" : error.message)
            : "Unknown error";
        return { data: fallback, error: `${source}: ${message}` };
    } finally {
        clearTimeout(timeoutId);
    }
}

async function fetchPosts() {
    try {
        const baseUrl = getBaseUrl();

        const [hatenaRes, zennRes, booklogRes, noteRes, filmarksRes, spotifyRes, hatenabookmarkRes, ff14AchievementsRes, tenhouRes, xRes, duolingoRes, steamRes, githubRes] =
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
                fetchEndpoint<Post[]>(baseUrl, "/api/github", "GitHub", []),
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
            ...githubRes.data.map((p: Post) => ({ ...p, platform: "github" })),
        ];

        allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const balancedPosts = balancePosts(allPosts as ContentItem[]);

        // Duolingo streak を読み取り
        let streak = 0;
        try {
            const duolingoPath = path.join(process.cwd(), "public/data/duolingo-stats.json");
            const duolingoData = JSON.parse(fs.readFileSync(duolingoPath, "utf-8")) as { stats?: { streak?: number } };
            streak = duolingoData.stats?.streak ?? 0;
        } catch { /* ignore */ }

        // Bio を読み取り
        let bio = "";
        try {
            const bioPath = path.join(process.cwd(), "public/data/bio.json");
            const bioData = JSON.parse(fs.readFileSync(bioPath, "utf-8")) as { bio?: string };
            bio = bioData.bio ?? "";
        } catch { /* ignore */ }

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
            githubRes.error,
        ].filter((value): value is string => Boolean(value));

        return {
            posts: balancedPosts,
            stats: {
                articles: hatenaRes.data.length + zennRes.data.length + noteRes.data.length,
                books: booklogRes.data.length,
                repos: githubRes.data.length,
                streak,
            },
            bio,
            errors,
        };
    } catch (error) {
        console.error("Failed to fetch content:", error);
        return {
            posts: [],
            stats: { articles: 0, books: 0, repos: 0, streak: 0 },
            bio: "",
            errors: ["ホームデータの取得に失敗しました"],
        };
    }
}

export default async function Home() {
    const { posts, stats, bio, errors } = await fetchPosts();

    if (errors.length > 0) {
        console.error("Feed fetch errors:", errors);
    }

    return (
        <div className="split-layout">
            <HomeSidebar stats={stats} bio={bio} />

            <div className="main-content">
                <div className="content-wrapper">
                    <h2 className="section-title">Recent Posts</h2>

                    {process.env.NODE_ENV === "development" && errors.length > 0 && (
                        <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            一部のデータ取得に失敗しました: {errors.join(" / ")}
                        </p>
                    )}

                    <HomeFeed initialPosts={posts} />

                    <div className="footer hide-desktop">
                        <p>© {new Date().getFullYear()} satory074</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
