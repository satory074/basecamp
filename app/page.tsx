import HomeSidebar from "./components/HomeSidebar";
import HomeFeed from "./components/HomeFeed";
import AppsCarousel from "./components/AppsCarousel";
import { Post, type AppEntry, type AppsFile } from "./lib/types";
import type { BarDatum } from "./components/charts/BarChart";
import { readFeedJson } from "./lib/feed-storage";
import { getHatenaPosts } from "./lib/feeds/hatena";
import { getZennPosts } from "./lib/feeds/zenn";
import { getBooklogPosts } from "./lib/feeds/booklog";
import { getNotePosts } from "./lib/feeds/note";
import { getFilmarksPosts } from "./lib/feeds/filmarks";
import { getSpotifyPosts } from "./lib/feeds/spotify";
import { getHatenaBookmarkPosts } from "./lib/feeds/hatenabookmark";
import { getFF14AchievementPosts } from "./lib/feeds/ff14-achievements";
import { getTenhouStats } from "./lib/feeds/tenhou";
import { getXPosts } from "./lib/feeds/x";
import { getDuolingoPosts, getDuolingoStats } from "./lib/feeds/duolingo";
import { getSteamPosts } from "./lib/feeds/steam";
import { getPlaystationPosts } from "./lib/feeds/playstation";
import { getGithubPosts } from "./lib/feeds/github";
import { getSwarmPosts } from "./lib/feeds/swarm";
import { getDiaryPosts } from "./lib/feeds/diary";


async function settled<T>(p: Promise<T>, fallback: T): Promise<T> {
    try {
        return await p;
    } catch {
        return fallback;
    }
}

async function fetchPosts() {
    const [
        hatena,
        zenn,
        booklog,
        note,
        filmarks,
        spotify,
        hatenabookmark,
        ff14Achievements,
        tenhou,
        x,
        duolingo,
        steam,
        playstation,
        github,
        swarm,
        diary,
    ] = await Promise.all([
        settled(getHatenaPosts(), [] as Post[]),
        settled(getZennPosts(), [] as Post[]),
        settled(getBooklogPosts(), [] as Post[]),
        settled(getNotePosts(), [] as Post[]),
        settled(getFilmarksPosts(), [] as Post[]),
        settled(getSpotifyPosts(), [] as Post[]),
        settled(getHatenaBookmarkPosts(), [] as Post[]),
        settled(getFF14AchievementPosts(), [] as Post[]),
        settled(getTenhouStats(), null),
        settled(getXPosts(), [] as Post[]),
        settled(getDuolingoPosts(), [] as Post[]),
        settled(getSteamPosts(), [] as Post[]),
        settled(getPlaystationPosts(), [] as Post[]),
        settled(getGithubPosts(), [] as Post[]),
        settled(getSwarmPosts(), [] as Post[]),
        settled(getDiaryPosts(), [] as Post[]),
    ]);

    const tenhouPosts: Post[] =
        tenhou?.recentMatches?.map((match) => ({
            id: `tenhou-${match.date}-${match.position}`,
            title: `${match.position}位`,
            url: "https://tenhou.net/",
            date: match.date,
            platform: "tenhou",
            description: `${match.roomType} ${match.score > 0 ? "+" : ""}${match.score}点`,
        })) || [];

    const allPosts: Post[] = [
        ...hatena.map((p: Post) => ({ ...p, platform: "hatena" })),
        ...zenn.map((p: Post) => ({ ...p, platform: "zenn" })),
        ...booklog.map((p: Post) => ({ ...p, platform: "booklog" })),
        ...note.map((p: Post) => ({ ...p, platform: "note" })),
        ...filmarks.map((p: Post) => ({ ...p, platform: "filmarks" })),
        ...spotify.map((p: Post) => ({ ...p, platform: "spotify" })),
        ...hatenabookmark.map((p: Post) => ({ ...p, platform: "hatenabookmark" })),
        ...ff14Achievements.map((p: Post) => ({ ...p, platform: "ff14-achievement" })),
        ...tenhouPosts,
        ...x.map((p: Post) => ({ ...p, platform: "x" })),
        ...duolingo.map((p: Post) => ({ ...p, platform: "duolingo" })),
        ...steam.map((p: Post) => ({ ...p, platform: "steam" })),
        ...playstation.map((p: Post) => ({ ...p, platform: "playstation" })),
        ...github.map((p: Post) => ({ ...p, platform: "github" })),
        ...swarm.map((p: Post) => ({ ...p, platform: "swarm" })),
        ...diary.map((p: Post) => ({ ...p, platform: "diary" })),
    ];

    allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const platformDisplayNames: Record<string, string> = {
        hatena: "Hatena",
        zenn: "Zenn",
        github: "GitHub",
        booklog: "Booklog",
        note: "Note",
        filmarks: "Filmarks",
        spotify: "Spotify",
        hatenabookmark: "HatenaBM",
        "ff14-achievement": "FF14実績",
        tenhou: "天鳳",
        x: "X",
        duolingo: "Duolingo",
        steam: "Steam",
        playstation: "PlayStation",
        diary: "日記",
        swarm: "Swarm",
    };

    const recentPosts = allPosts.filter((p) => new Date(p.date) >= threeDaysAgo);
    const platformCounts = recentPosts.reduce<Record<string, number>>((acc, p) => {
        acc[p.platform] = (acc[p.platform] ?? 0) + 1;
        return acc;
    }, {});

    const platformActivity: BarDatum[] = Object.entries(platformCounts)
        .map(([platform, count]) => ({
            label: platformDisplayNames[platform] ?? platform,
            value: count,
            color: `var(--color-${platform})`,
        }))
        .sort((a, b) => b.value - a.value);

    let streak = 0;
    try {
        const duolingoData = await getDuolingoStats();
        streak = duolingoData?.currentStats?.streak ?? 0;
    } catch { /* ignore */ }

    let bio = "";
    try {
        const bioData = await readFeedJson<{ bio?: string }>("bio.json");
        bio = bioData.bio ?? "";
    } catch { /* ignore */ }

    let apps: AppEntry[] = [];
    try {
        const appsData = await readFeedJson<AppsFile>("apps.json");
        apps = appsData.apps ?? [];
    } catch { /* ignore */ }

    return {
        posts: allPosts,
        stats: {
            articles: hatena.length + zenn.length + note.length,
            books: booklog.length,
            repos: github.length,
            streak,
        },
        platformActivity,
        bio,
        apps,
    };
}

export default async function Home() {
    const { posts, stats, platformActivity, bio, apps } = await fetchPosts();

    return (
        <div className="split-layout">
            <HomeSidebar stats={stats} bio={bio} />

            <div className="main-content">
                <div className="content-wrapper">
                    <AppsCarousel apps={apps} />

                    <h2 id="recent-posts-heading" className="section-title">Recent Posts</h2>

                    <HomeFeed initialPosts={posts} platformActivity={platformActivity} />

                    <div id="site-footer" tabIndex={-1} className="footer">
                        <p>© {new Date().getFullYear()} satory074</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
