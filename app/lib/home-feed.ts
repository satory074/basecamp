import { cache } from "react";
import { Post, type AppEntry, type AppsFile } from "./types";
import type { BarDatum } from "../components/charts/BarChart";
import { readFeedJson } from "./feed-storage";
import { getHatenaPosts } from "./feeds/hatena";
import { getZennPosts } from "./feeds/zenn";
import { getBooklogPosts } from "./feeds/booklog";
import { getNotePosts } from "./feeds/note";
import { getFilmarksPosts } from "./feeds/filmarks";
import { getSpotifyPosts } from "./feeds/spotify";
import { getHatenaBookmarkPosts } from "./feeds/hatenabookmark";
import { getFF14AchievementPosts } from "./feeds/ff14-achievements";
import { getTenhouStats } from "./feeds/tenhou";
import { getXPosts } from "./feeds/x";
import { getDuolingoPosts, getDuolingoStats } from "./feeds/duolingo";
import { getSteamPosts } from "./feeds/steam";
import { getPlaystationPosts } from "./feeds/playstation";
import { getGithubPosts } from "./feeds/github";
import { getSwarmPosts } from "./feeds/swarm";
import { getDiaryPosts } from "./feeds/diary";
import { getAlcoPosts } from "./feeds/alco";
import { getNpbPosts } from "./feeds/npb";

/**
 * ホームのフィード用データ。全プラットフォームを build 時に読み、日付降順に並べる。
 * ホーム (app/page.tsx)・全件 JSON (app/api/home-feed)・design-mockups が共有する。
 * React の cache() で 1 回の描画の中では 1 回だけ読む。
 */

async function settled<T>(p: Promise<T>, fallback: T): Promise<T> {
    try {
        return await p;
    } catch {
        return fallback;
    }
}

async function loadHomeData() {
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
        alco,
        baseball,
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
        settled(getAlcoPosts(), [] as Post[]),
        settled(getNpbPosts(), [] as Post[]),
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
        ...alco.map((p: Post) => ({ ...p, platform: "alco" })),
        ...baseball.map((p: Post) => ({ ...p, platform: "baseball" })),
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
        alco: "飲酒",
        baseball: "野球",
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

export const getHomeData = cache(loadHomeData);

export type HomeData = Awaited<ReturnType<typeof loadHomeData>>;
export type HomeStats = HomeData["stats"];
