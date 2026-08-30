/**
 * 日記 v2: 各ソースから対象日 (JST 暦日) のメトリクスを集めて DiaryFacts にする。
 *
 * - GCS 系 (X / Spotify / Steam / PlayStation / Duolingo / Booklog / Filmarks / FF14 / Swarm / alco) は
 *   `readFeed` で JSON を読み、同じ JSON の履歴からベースライン (28 日平均・90 日最大・「初めて」) も計算する
 * - live 系 (GitHub events + commits API / Zenn・Hatena・note RSS / 天鳳 nodocchi) はその場で叩く
 * - ソースごとに try/catch し、失敗したソースは undefined (= そのソースの記録なし) として続行する
 *
 * ここで集めるのは「本人の活動」だけ。野球やはてブ (他人のコンテンツ) は対象外。
 * X のいいね / ブックマークは件数のみで本文は保持しない (公開サイトに他人の投稿本文を流さない)。
 */

import { config } from "../../../app/lib/config";
import type { DiaryFacts, DiaryGameFact } from "../../../app/lib/diary-types";
import { getHatenaPosts } from "../../../app/lib/feeds/hatena";
import { getNotePosts } from "../../../app/lib/feeds/note";
import { getTenhouStats } from "../../../app/lib/feeds/tenhou";
import { getZennPosts } from "../../../app/lib/feeds/zenn";
import { readFeed } from "../feed-storage";
import { type DayWindow, daysBefore, diffDays, inWindow, jstDayKey, parseJpDate, shiftDayKey } from "./day";

// ---- GitHub (live) ----

interface GhEvent {
    type: string;
    created_at: string;
    repo: { name: string };
    payload: {
        ref?: string | null;
        ref_type?: string;
        release?: { tag_name?: string; html_url?: string };
    };
}

async function ghFetch<T>(url: string): Promise<T> {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "basecamp-diary",
    };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(url, { headers, signal: controller.signal });
        if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url.replace(/\?.*$/, "")}`);
        return (await res.json()) as T;
    } finally {
        clearTimeout(timer);
    }
}

async function collectGithub(w: DayWindow): Promise<DiaryFacts["github"]> {
    const user = config.profiles.github.username;
    const events: GhEvent[] = [];
    for (let page = 1; page <= 3; page++) {
        const batch = await ghFetch<GhEvent[]>(`https://api.github.com/users/${user}/events/public?per_page=100&page=${page}`);
        events.push(...batch);
        if (batch.length < 100) break;
    }
    if (events.length === 0) return undefined;

    const pushes = events.filter((e) => e.type === "PushEvent");
    const todayRefsByRepo = new Map<string, Set<string>>();
    for (const e of pushes) {
        if (!inWindow(e.created_at, w)) continue;
        const ref = (e.payload.ref ?? "").replace(/^refs\/heads\//, "");
        if (!todayRefsByRepo.has(e.repo.name)) todayRefsByRepo.set(e.repo.name, new Set());
        todayRefsByRepo.get(e.repo.name)!.add(ref);
    }

    const repoUrl = (name: string) => `https://github.com/${name}`;
    const newRepos = events
        .filter((e) => e.type === "CreateEvent" && e.payload.ref_type === "repository" && inWindow(e.created_at, w))
        .map((e) => ({ name: e.repo.name, url: repoUrl(e.repo.name) }));
    const releases = events
        .filter((e) => e.type === "ReleaseEvent" && inWindow(e.created_at, w))
        .map((e) => ({
            repo: e.repo.name,
            tag: e.payload.release?.tag_name ?? "",
            url: e.payload.release?.html_url ?? `${repoUrl(e.repo.name)}/releases`,
        }));

    const oldest = events.reduce((min, e) => Math.min(min, new Date(e.created_at).getTime()), Infinity);
    const historyDays = Number.isFinite(oldest) ? Math.max(0, diffDays(w.start, new Date(oldest))) : 0;

    if (todayRefsByRepo.size === 0 && newRepos.length === 0 && releases.length === 0) return undefined;

    const repos: NonNullable<DiaryFacts["github"]>["repos"] = [];
    for (const [repo, refs] of todayRefsByRepo) {
        // public events の PushEvent には commit 数が入らないので commits API で数える (branch ごとに union)
        const shas = new Set<string>();
        for (const ref of refs) {
            const params = new URLSearchParams({
                author: user,
                since: w.start.toISOString(),
                until: w.end.toISOString(),
                per_page: "100",
            });
            if (ref) params.set("sha", ref);
            const commits = await ghFetch<{ sha: string }[]>(`https://api.github.com/repos/${repo}/commits?${params}`);
            for (const c of commits) shas.add(c.sha);
        }
        if (shas.size === 0) continue; // 本人 author の commit が無い push (他人の PR マージ等) はノイズなので落とす
        const prevPush = pushes
            .filter((e) => e.repo.name === repo && new Date(e.created_at) < w.start)
            .map((e) => new Date(e.created_at))
            .sort((a, b) => b.getTime() - a.getTime())[0];
        repos.push({
            name: repo,
            commits: shas.size,
            url: repoUrl(repo),
            daysSinceLastPush: prevPush ? diffDays(w.start, prevPush) : undefined,
        });
    }
    repos.sort((a, b) => b.commits - a.commits || a.name.localeCompare(b.name));

    const pushDays = new Set(pushes.map((e) => jstDayKey(new Date(e.created_at))));
    let pushStreakDays = 0;
    for (let k = w.dayKey; pushDays.has(k); k = shiftDayKey(k, -1)) pushStreakDays++;

    if (repos.length === 0 && newRepos.length === 0 && releases.length === 0) return undefined;
    return {
        commits: repos.reduce((sum, r) => sum + r.commits, 0),
        repos,
        newRepos,
        releases,
        pushStreakDays,
        historyDays,
    };
}

// ---- Articles (live RSS) ----

async function collectArticles(w: DayWindow): Promise<DiaryFacts["articles"]> {
    const sources = [
        ["zenn", getZennPosts],
        ["hatena", getHatenaPosts],
        ["note", getNotePosts],
    ] as const;
    const out: NonNullable<DiaryFacts["articles"]> = [];
    for (const [platform, fetchPosts] of sources) {
        try {
            const posts = await fetchPosts();
            for (const p of posts) {
                if (inWindow(p.date, w) && p.title && p.url) {
                    out.push({ platform, title: p.title, url: p.url, thumbnail: p.thumbnail });
                }
            }
        } catch (e) {
            console.warn(`[diary] ${platform} RSS failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    return out.length > 0 ? out : undefined;
}

// ---- X (GCS) ----

interface XTweet {
    id: string;
    date: string;
    category?: "post" | "like" | "bookmark";
    description?: string;
    isRetweet?: boolean;
}

/** Booklog / Filmarks の自動シェア投稿 (読了・視聴ハイライトと二重になる) */
function isAutoShare(text: string | undefined): boolean {
    if (!text) return false;
    return /#ブクログ|booklog\.jp|さんの感想・レビュー|#Filmarks|filmarks\.com/i.test(text);
}

function cleanTweetText(text: string | undefined, max = 60): string {
    if (!text) return "";
    const cleaned = text
        .replace(/https?:\/\/\S+/g, "")
        .replace(/\s+/g, " ")
        .trim();
    return cleaned.length > max ? `${cleaned.slice(0, max)}…` : cleaned;
}

async function collectX(w: DayWindow): Promise<DiaryFacts["x"]> {
    const data = await readFeed<{ username?: string; tweets?: XTweet[] } | XTweet[]>("x-tweets.json");
    const tweets = Array.isArray(data) ? data : (data.tweets ?? []);
    const username = (Array.isArray(data) ? undefined : data.username) || config.profiles.x.username;
    const today = tweets.filter((t) => inWindow(t.date, w));
    if (today.length === 0) return undefined;

    const isRepost = (t: XTweet) => t.isRetweet ?? t.description?.startsWith("RT @") ?? false;
    const posts = today
        .filter((t) => t.category === "post" && !isRepost(t) && !isAutoShare(t.description))
        .map((t) => ({ id: t.id, text: cleanTweetText(t.description), url: `https://x.com/${username}/status/${t.id}` }))
        .filter((p) => p.text.length > 0);
    return {
        posts,
        reposts: today.filter((t) => t.category === "post" && isRepost(t)).length,
        likes: today.filter((t) => t.category === "like").length,
        bookmarks: today.filter((t) => t.category === "bookmark").length,
    };
}

// ---- Spotify (GCS) ----

interface SpotifyPlay {
    id: string;
    title?: string;
    artist?: string;
    url?: string;
    thumbnail?: string;
    date: string;
}

function normalizeName(name: string): string {
    return name.trim().toLowerCase();
}

async function collectSpotify(w: DayWindow): Promise<DiaryFacts["spotify"]> {
    const data = await readFeed<{ plays?: SpotifyPlay[] }>("spotify-plays.json");
    const plays = (data.plays ?? []).filter((p) => !isNaN(new Date(p.date).getTime()));
    const today = plays.filter((p) => inWindow(p.date, w));
    if (today.length === 0) return undefined;

    const before = plays.filter((p) => new Date(p.date) < w.start);
    const oldest = before.reduce((min, p) => Math.min(min, new Date(p.date).getTime()), Infinity);
    const historyDays = Number.isFinite(oldest) ? diffDays(w.start, new Date(oldest)) : 0;

    const artistCounts = new Map<string, { name: string; plays: number; thumbnail?: string }>();
    for (const p of today) {
        const name = p.artist?.trim();
        if (!name) continue;
        const key = normalizeName(name);
        const cur = artistCounts.get(key) ?? { name, plays: 0, thumbnail: p.thumbnail };
        cur.plays++;
        artistCounts.set(key, cur);
    }
    const ranked = [...artistCounts.values()].sort((a, b) => b.plays - a.plays || a.name.localeCompare(b.name));
    const topArtist = ranked[0];

    const knownArtists = new Set(before.map((p) => normalizeName(p.artist ?? "")).filter(Boolean));
    const newArtists = historyDays >= 28
        ? ranked.filter((a) => a.plays >= 2 && !knownArtists.has(normalizeName(a.name))).map((a) => ({ name: a.name, plays: a.plays }))
        : [];

    const last28 = daysBefore(w, 28);
    const plays28 = plays.filter((p) => inWindow(p.date, last28)).length;
    const last90 = daysBefore(w, 90);
    const perDay = new Map<string, number>();
    for (const p of plays) {
        if (!inWindow(p.date, last90)) continue;
        const k = jstDayKey(new Date(p.date));
        perDay.set(k, (perDay.get(k) ?? 0) + 1);
    }
    const max90d = Math.max(0, ...perDay.values());

    return {
        plays: today.length,
        uniqueTracks: new Set(today.map((p) => p.url || `${p.title}|${p.artist}`)).size,
        uniqueArtists: artistCounts.size,
        topArtist,
        newArtists,
        avg28d: Math.round((plays28 / 28) * 10) / 10,
        max90d,
        historyDays,
    };
}

// ---- Duolingo (GCS) ----

interface DuolingoEntry {
    date: string;
    xpGained?: number;
    streak?: number;
}

async function collectDuolingo(w: DayWindow, now: Date): Promise<DiaryFacts["duolingo"]> {
    const data = await readFeed<{ currentStats?: { streak?: number; totalXp?: number }; entries?: DuolingoEntry[] }>("duolingo-stats.json");
    const entries = data.entries ?? [];
    const today = entries.filter((e) => inWindow(e.date, w));
    const isToday = jstDayKey(now) === w.dayKey;
    if (today.length === 0 && !isToday) return undefined;

    const xp = today.reduce((sum, e) => sum + (e.xpGained ?? 0), 0);
    const streakFromEntries = Math.max(0, ...today.map((e) => e.streak ?? 0));
    const streak = streakFromEntries > 0 ? streakFromEntries : (isToday ? (data.currentStats?.streak ?? 0) : 0);
    if (streak === 0 && xp === 0) return undefined;

    // 対象日終了時点の総 XP (バックフィル時は以後の entries の分を引く)
    const laterXp = entries.filter((e) => new Date(e.date) >= w.end).reduce((sum, e) => sum + (e.xpGained ?? 0), 0);
    const totalXp = Math.max(0, (data.currentStats?.totalXp ?? 0) - laterXp);
    return { xp, streak, totalXp };
}

// ---- Booklog (GCS) ----

interface BooklogPost {
    title?: string;
    url?: string;
    date: string;
    description?: string;
    thumbnail?: string;
    rating?: number;
    finishedDate?: string;
}

async function collectBooklog(w: DayWindow): Promise<DiaryFacts["booklog"]> {
    const data = await readFeed<{ posts?: BooklogPost[]; entries?: BooklogPost[] }>("booklog-feed.json");
    const posts = data.posts ?? data.entries ?? [];

    // 読了は `date` (棚追加日) ではなく `finishedDate` (読了日) で判定する
    const finishedAll = posts
        .map((p) => ({ post: p, key: p.description === "読み終わった" ? parseJpDate(p.finishedDate) : null }))
        .filter((x): x is { post: BooklogPost; key: string } => x.key !== null);
    const thisYear = finishedAll
        .filter((x) => x.key.startsWith(`${w.year}-`) && x.key <= w.dayKey)
        .sort((a, b) => a.key.localeCompare(b.key) || (a.post.title ?? "").localeCompare(b.post.title ?? ""));
    const finished = thisYear
        .map((x, i) => ({ ...x, nth: i + 1 }))
        .filter((x) => x.key === w.dayKey)
        .map((x) => ({
            title: x.post.title ?? "?",
            url: x.post.url ?? "",
            rating: x.post.rating,
            nthThisYear: x.nth,
            thumbnail: x.post.thumbnail,
        }));

    const pick = (status: string) =>
        posts
            .filter((p) => p.description === status && inWindow(p.date, w))
            .map((p) => ({ title: p.title ?? "?", url: p.url ?? "", thumbnail: p.thumbnail }));
    const started = pick("いま読んでる");
    const wanted = pick("読みたい");

    if (finished.length === 0 && started.length === 0 && wanted.length === 0) return undefined;
    return { finished, started, wanted };
}

// ---- Filmarks (GCS) ----

interface FilmarksPost {
    title?: string;
    url?: string;
    date: string;
    description?: string;
    thumbnail?: string;
    rating?: number;
}

async function collectFilmarks(w: DayWindow): Promise<DiaryFacts["filmarks"]> {
    const data = await readFeed<{ posts?: FilmarksPost[]; entries?: FilmarksPost[] }>("filmarks-feed.json");
    const posts = (data.posts ?? data.entries ?? []).filter((p) => !isNaN(new Date(p.date).getTime()));
    const thisYear = posts
        .filter((p) => jstDayKey(new Date(p.date)).startsWith(`${w.year}-`) && new Date(p.date) < w.end)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const watched = thisYear
        .map((p, i) => ({ post: p, nth: i + 1 }))
        .filter((x) => inWindow(x.post.date, w))
        .map((x) => ({
            title: x.post.title ?? "?",
            url: x.post.url ?? "",
            type: x.post.description ?? "映画",
            rating: x.post.rating,
            nthThisYear: x.nth,
            thumbnail: x.post.thumbnail,
        }));
    return watched.length > 0 ? { watched } : undefined;
}

// ---- Steam / PlayStation / FF14 (GCS) ----

interface AchievementItem {
    gameName?: string;
    title?: string;
    icon?: string;
    date: string;
    trophyType?: string;
}

function groupGames(items: AchievementItem[], w: DayWindow): { games: DiaryGameFact[]; totalAfter: number } | undefined {
    const valid = items.filter((a) => !isNaN(new Date(a.date).getTime()));
    const today = valid.filter((a) => inWindow(a.date, w));
    if (today.length === 0) return undefined;
    const byGame = new Map<string, AchievementItem[]>();
    for (const a of today) {
        const name = a.gameName ?? "不明";
        if (!byGame.has(name)) byGame.set(name, []);
        byGame.get(name)!.push(a);
    }
    const games: DiaryGameFact[] = [];
    for (const [name, list] of byGame) {
        const prior = valid.filter((a) => (a.gameName ?? "不明") === name && new Date(a.date) < w.start);
        const latestPrior = prior.reduce((max, a) => Math.max(max, new Date(a.date).getTime()), -Infinity);
        games.push({
            name,
            count: list.length,
            titles: list.map((a) => a.title ?? "?"),
            isFirst: prior.length === 0,
            daysSinceLast: Number.isFinite(latestPrior) ? diffDays(w.start, new Date(latestPrior)) : undefined,
            icon: list[0].icon,
        });
    }
    games.sort((a, b) => b.count - a.count);
    return { games, totalAfter: valid.filter((a) => new Date(a.date) < w.end).length };
}

async function collectSteam(w: DayWindow): Promise<DiaryFacts["steam"]> {
    const data = await readFeed<{ achievements?: AchievementItem[] }>("steam-achievements.json");
    return groupGames(data.achievements ?? [], w);
}

async function collectPlaystation(w: DayWindow): Promise<DiaryFacts["playstation"]> {
    const data = await readFeed<{ trophies?: AchievementItem[] }>("playstation-trophies.json");
    const trophies = data.trophies ?? [];
    const grouped = groupGames(trophies, w);
    if (!grouped) return undefined;
    const platinumGames = new Set(
        trophies.filter((t) => inWindow(t.date, w) && t.trophyType === "platinum").map((t) => t.gameName ?? "不明"),
    );
    return {
        games: grouped.games.map((g) => ({ ...g, platinum: platinumGames.has(g.name) })),
        totalAfter: grouped.totalAfter,
    };
}

async function collectFF14(w: DayWindow): Promise<DiaryFacts["ff14"]> {
    const data = await readFeed<{ posts?: { title?: string; url?: string; date: string }[] }>("ff14-achievements-feed.json");
    const achievements = (data.posts ?? [])
        .filter((p) => inWindow(p.date, w))
        .map((p) => ({ title: p.title ?? "?", url: p.url }));
    return achievements.length > 0 ? { achievements } : undefined;
}

// ---- 天鳳 (live) ----

async function collectTenhou(w: DayWindow): Promise<DiaryFacts["tenhou"]> {
    const stats = await getTenhouStats();
    const matches = (stats.recentMatches ?? []).filter((m) => inWindow(m.date, w));
    if (matches.length === 0) return undefined;
    return {
        games: matches.length,
        tops: matches.filter((m) => m.position === 1).length,
        lasts: matches.filter((m) => m.position === 4).length,
        points: Math.round(matches.reduce((sum, m) => sum + (m.score ?? 0), 0) * 10) / 10,
        positions: matches.map((m) => m.position),
    };
}

// ---- Swarm (GCS) ----

async function collectSwarm(w: DayWindow): Promise<DiaryFacts["swarm"]> {
    const data = await readFeed<{ checkins?: { date: string; venueName?: string }[] }>("swarm-checkins.json");
    const checkins = (data.checkins ?? []).filter((c) => c.venueName && !isNaN(new Date(c.date).getTime()));
    const today = checkins.filter((c) => inWindow(c.date, w));
    if (today.length === 0) return undefined;
    const seen = new Set<string>();
    const venues: { name: string; isFirst: boolean }[] = [];
    for (const c of today) {
        const name = c.venueName!.trim();
        if (seen.has(name)) continue;
        seen.add(name);
        const isFirst = !checkins.some((x) => x.venueName!.trim() === name && new Date(x.date) < w.start);
        venues.push({ name, isFirst });
    }
    return { venues };
}

// ---- alco (GCS) ----

async function collectAlco(w: DayWindow): Promise<DiaryFacts["alco"]> {
    const data = await readFeed<{ days?: { dayKey: string; totalG?: number; count?: number }[] }>("alco-drinks.json");
    const byDay = new Map((data.days ?? []).map((d) => [d.dayKey, d]));
    const day = byDay.get(w.dayKey);
    if (!day) return undefined;
    const count = day.count ?? 0;
    let restStreak = 0;
    for (let k = w.dayKey; byDay.get(k)?.count === 0 && restStreak < 365; k = shiftDayKey(k, -1)) restStreak++;
    return { count, totalG: Math.round((day.totalG ?? 0) * 10) / 10, restDay: count === 0, restStreak };
}

// ---- Entry point ----

async function safe<T>(label: string, fn: () => Promise<T | undefined>): Promise<T | undefined> {
    try {
        return await fn();
    } catch (e) {
        console.warn(`[diary] ${label} collector failed: ${e instanceof Error ? e.message : String(e)}`);
        return undefined;
    }
}

export async function collectFacts(w: DayWindow, now: Date = new Date()): Promise<DiaryFacts> {
    const [github, articles, x, spotify, duolingo, booklog, filmarks, steam, playstation, ff14, tenhou, swarm, alco] =
        await Promise.all([
            safe("github", () => collectGithub(w)),
            safe("articles", () => collectArticles(w)),
            safe("x", () => collectX(w)),
            safe("spotify", () => collectSpotify(w)),
            safe("duolingo", () => collectDuolingo(w, now)),
            safe("booklog", () => collectBooklog(w)),
            safe("filmarks", () => collectFilmarks(w)),
            safe("steam", () => collectSteam(w)),
            safe("playstation", () => collectPlaystation(w)),
            safe("ff14", () => collectFF14(w)),
            safe("tenhou", () => collectTenhou(w)),
            safe("swarm", () => collectSwarm(w)),
            safe("alco", () => collectAlco(w)),
        ]);

    const facts: DiaryFacts = {};
    if (github) facts.github = github;
    if (articles) facts.articles = articles;
    if (x) facts.x = x;
    if (spotify) facts.spotify = spotify;
    if (duolingo) facts.duolingo = duolingo;
    if (booklog) facts.booklog = booklog;
    if (filmarks) facts.filmarks = filmarks;
    if (steam) facts.steam = steam;
    if (playstation) facts.playstation = playstation;
    if (ff14) facts.ff14 = ff14;
    if (tenhou) facts.tenhou = tenhou;
    if (swarm) facts.swarm = swarm;
    if (alco) facts.alco = alco;
    return facts;
}
