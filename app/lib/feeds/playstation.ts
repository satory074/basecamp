import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";
import type { DiaryStat } from "../diary-types";
import { formatDuration } from "../shared/duration";
import type {
    PsGame,
    PsLibraryItem,
    PsPlayDay,
    PsPlaysFile,
    PsProfile,
    PsProfileFile,
    PsTrophiesFile,
    PsTrophyEntry,
    PsTrophySet,
    PsTrophySummary,
    TrophyCounts,
} from "../playstation-types";
import { gameAnchor, psImage, tierMaterial, totalTrophies } from "../playstation-types";

const PAGE_PATH = "/playstation/";

interface PlaystationData {
    trophies: PsTrophyEntry[];
    profile: PsProfileFile | null;
    plays: PsPlaysFile | null;
}

async function readOrNull<T>(filename: string): Promise<T | null> {
    try {
        return await readFeedJson<T>(filename);
    } catch {
        return null;
    }
}

async function getPlaystationData(): Promise<PlaystationData> {
    const [trophies, profile, plays] = await Promise.all([
        readOrNull<PsTrophiesFile>("playstation-trophies.json"),
        readOrNull<PsProfileFile>("playstation-profile.json"),
        readOrNull<PsPlaysFile>("playstation-plays.json"),
    ]);
    return { trophies: trophies?.trophies ?? [], profile, plays };
}

function gameUrl(conceptId: string | undefined): string {
    return conceptId ? `${PAGE_PATH}#${gameAnchor(conceptId)}` : PAGE_PATH;
}

function stat(key: string, icon: string, label: string, value: string): DiaryStat {
    return { key, icon, label, value };
}

const TIER_LABEL = { bronze: "ブロンズ", silver: "シルバー", gold: "ゴールド", platinum: "プラチナ" } as const;

// ---- ホームフィード ----

function trophyPost(t: PsTrophyEntry): Post {
    const stats: DiaryStat[] = [stat("game", "🎮", "", t.gameName)];
    if (t.groupName) stats.push(stat("dlc", "", "DLC", t.groupName));
    if (t.earnedRate) stats.push(stat("rate", Number(t.earnedRate) < 5 ? "💎" : "", "獲得率", `${t.earnedRate}%`));
    return {
        id: t.id,
        title: t.title,
        url: gameUrl(t.conceptId),
        date: t.date,
        platform: "playstation",
        description: t.detail || t.gameName,
        category: t.trophyType, // bronze/silver/gold/platinum → tier badge
        thumbnail: t.icon || undefined,
        data: { stats },
    };
}

function playPost(d: PsPlayDay): Post {
    const stats = [stat("total", "", "累計", formatDuration(d.totalSecondsAfter)), stat("platform", "", "", d.platform)];
    return {
        id: d.id,
        title: `${d.name} を ${formatDuration(d.seconds)} プレイ`,
        url: gameUrl(d.conceptId),
        date: d.lastAt,
        platform: "playstation",
        category: d.isFirst ? "first-play" : "play",
        thumbnail: psImage(d.icon, 240),
        data: { stats },
    };
}

/** 記録開始前のゲームも「はじめてプレイ」を時系列に並べる (firstPlayed は PSN が全タイトル分持っている) */
function firstPlayPost(g: PsGame): Post {
    const first = g.titles.reduce((min, t) => (t.firstPlayed < min.firstPlayed ? t : min), g.titles[0]);
    return {
        id: `psfirst-${g.conceptId}`,
        title: `${g.name} をはじめてプレイ`,
        url: gameUrl(g.conceptId),
        date: g.firstPlayed,
        platform: "playstation",
        category: "first-play",
        thumbnail: psImage(g.icon, 240),
        data: { stats: [stat("platform", "", "", first?.platform ?? g.platforms[0] ?? "PS")] },
    };
}

function levelPost(level: number, reachedAt: string, summary: PsTrophySummary | undefined): Post {
    const material = summary ? tierMaterial(summary.tier) : "bronze";
    return {
        id: `pslevel-${level}`,
        title: `トロフィーレベル ${level} に到達`,
        url: PAGE_PATH,
        date: reachedAt,
        platform: "playstation",
        category: "level",
        data: { stats: [stat("tier", "", "", `${TIER_LABEL[material]}ティア`)] },
    };
}

function libraryPost(item: PsLibraryItem, at: string): Post {
    const stats = [stat("platform", "", "", item.platform)];
    if (item.membership && item.membership !== "NONE") stats.push(stat("plus", "", "", "PS Plus"));
    return {
        id: `pslib-${item.titleId}`,
        title: item.isPreOrder ? `${item.name} を予約` : `${item.name} をライブラリに追加`,
        url: `${PAGE_PATH}#library`,
        date: at,
        platform: "playstation",
        category: "library",
        thumbnail: psImage(item.image, 240),
        data: { stats },
    };
}

export async function getPlaystationPosts(): Promise<Post[]> {
    try {
        const { trophies, profile, plays } = await getPlaystationData();
        const posts: Post[] = trophies.map(trophyPost);

        const days = plays?.days ?? [];
        posts.push(...days.map(playPost));

        // プレイ記録側に「はじめて」の日があるゲームは二重に出さない
        const firstPlayedTracked = new Set(days.filter((d) => d.isFirst).map((d) => d.conceptId));
        for (const g of profile?.games ?? []) {
            if (!firstPlayedTracked.has(g.conceptId) && g.titles.length > 0) posts.push(firstPlayPost(g));
        }

        for (const ev of profile?.levelHistory ?? []) {
            if (ev.reachedAt) posts.push(levelPost(ev.level, ev.reachedAt, profile?.summary));
        }
        for (const item of profile?.library ?? []) {
            if (item.firstSeenAt) posts.push(libraryPost(item, item.firstSeenAt));
        }

        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}

// ---- /playstation ページ ----

export interface PsTrophySetView extends PsTrophySet {
    lastEarnedAt?: string;
    /** DLC (default 以外のグループ) */
    dlcs: PsTrophySet["groups"];
}

export interface PsGameView extends PsGame {
    trophySets: PsTrophySetView[];
    trophiesEarned: number;
}

export interface PsCalendarDay {
    dayKey: string;
    seconds: number;
    games: { name: string; seconds: number }[];
}

export interface PsCalendarView {
    /** ビルド時点の JST 日付 */
    today: string;
    /** 記録開始日 (JST)。まだ記録が無ければ null */
    since: string | null;
    days: PsCalendarDay[];
    last7: number;
    last30: number;
    activeDays30: number;
    best?: PsCalendarDay;
}

export interface PsLibraryView {
    key: string;
    name: string;
    image?: string;
    platforms: string[];
    status: "played" | "unplayed" | "preorder";
    seconds: number;
    plus: boolean;
    conceptId?: string;
}

export interface PlaystationView {
    lastUpdated: string | null;
    profile: PsProfile | null;
    summary: PsTrophySummary | null;
    totals: { seconds: number; games: number; trophies: number; library: number; unplayed: number };
    recent: PsGameView[];
    ranking: PsGameView[];
    games: PsGameView[];
    /** プレイ履歴と対応が取れないが獲得済みトロフィーのあるトロフィーセット */
    otherTrophySets: PsTrophySetView[];
    calendar: PsCalendarView;
    rare: PsTrophyEntry[];
    library: PsLibraryView[];
}

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function jstDayKey(d: Date): string {
    return new Date(d.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

function shiftDayKey(dayKey: string, days: number): string {
    const [y, m, d] = dayKey.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function normalizeName(name: string): string {
    return name.normalize("NFKC").toLowerCase().replace(/[\s　–—\-:：・™®]/g, "");
}

function sumCounts(list: TrophyCounts[]): number {
    return list.reduce((sum, c) => sum + totalTrophies(c), 0);
}

function buildTrophySetViews(sets: PsTrophySet[], trophies: PsTrophyEntry[]): Map<string, PsTrophySetView> {
    const lastEarned = new Map<string, string>();
    for (const t of trophies) {
        const cur = lastEarned.get(t.npCommunicationId);
        if (!cur || t.date > cur) lastEarned.set(t.npCommunicationId, t.date);
    }
    return new Map(
        sets.map((s) => [
            s.npCommunicationId,
            {
                ...s,
                lastEarnedAt: lastEarned.get(s.npCommunicationId),
                dlcs: s.groups.filter((g) => g.id !== "default"),
            },
        ]),
    );
}

function buildCalendar(plays: PsPlaysFile | null, now: Date): PsCalendarView {
    const today = jstDayKey(now);
    const byDay = new Map<string, PsCalendarDay>();
    for (const d of plays?.days ?? []) {
        const day = byDay.get(d.dayKey) ?? { dayKey: d.dayKey, seconds: 0, games: [] };
        day.seconds += d.seconds;
        day.games.push({ name: d.name, seconds: d.seconds });
        byDay.set(d.dayKey, day);
    }
    for (const day of byDay.values()) day.games.sort((a, b) => b.seconds - a.seconds);

    const within = (n: number) => {
        const from = shiftDayKey(today, -(n - 1));
        return [...byDay.values()].filter((d) => d.dayKey >= from && d.dayKey <= today);
    };
    const last30Days = within(30);
    const days = [...byDay.values()].sort((a, b) => (a.dayKey < b.dayKey ? -1 : 1));
    const best = days.reduce<PsCalendarDay | undefined>((max, d) => (!max || d.seconds > max.seconds ? d : max), undefined);

    return {
        today,
        since: plays?.since ? jstDayKey(new Date(plays.since)) : null,
        days,
        last7: within(7).reduce((s, d) => s + d.seconds, 0),
        last30: last30Days.reduce((s, d) => s + d.seconds, 0),
        activeDays30: last30Days.length,
        best,
    };
}

function buildLibrary(items: PsLibraryItem[], games: PsGame[]): PsLibraryView[] {
    const gameByTitle = new Map<string, PsGame>();
    const gameByName = new Map<string, PsGame>();
    for (const g of games) {
        for (const t of g.titles) gameByTitle.set(t.titleId, g);
        gameByName.set(normalizeName(g.name), g);
    }

    // PS4 版と PS5 版 (クロスバイ) は 1 本にまとめる。ライブラリ名はプレイ履歴の名前と表記が違うことがある
    // (例: "Disco Elysium" と "ディスコ エリジウム ザ ファイナル カット") ので、先に titleId で当たった
    // ライブラリ名をそのゲームの別名として登録し、残りを名前で寄せる
    for (const item of items) {
        const game = gameByTitle.get(item.titleId);
        if (game) gameByName.set(normalizeName(item.name), game);
    }
    const groups = new Map<string, { game?: PsGame; items: PsLibraryItem[] }>();
    for (const item of items) {
        const nameKey = normalizeName(item.name);
        const game = gameByTitle.get(item.titleId) ?? gameByName.get(nameKey);
        const key = game ? `concept-${game.conceptId}` : `name-${nameKey}`;
        const group = groups.get(key) ?? { game, items: [] };
        group.items.push(item);
        groups.set(key, group);
    }

    const views: PsLibraryView[] = [];
    for (const [key, { game, items: list }] of groups) {
        const primary = [...list].sort((a, b) => (a.platform < b.platform ? 1 : -1))[0]; // PS5 版の画像を優先
        const preorder = list.every((i) => i.isPreOrder);
        views.push({
            key,
            name: game?.name ?? primary.name,
            image: primary.image,
            platforms: [...new Set(list.map((i) => i.platform))].sort().reverse(),
            status: game ? "played" : preorder ? "preorder" : "unplayed",
            seconds: game?.seconds ?? 0,
            plus: list.some((i) => i.membership && i.membership !== "NONE"),
            conceptId: game?.conceptId,
        });
    }

    const order = { preorder: 0, unplayed: 1, played: 2 } as const;
    return views.sort((a, b) => order[a.status] - order[b.status] || b.seconds - a.seconds || a.name.localeCompare(b.name, "ja"));
}

export async function getPlaystationView(now: Date = new Date()): Promise<PlaystationView> {
    const { trophies, profile, plays } = await getPlaystationData();
    const setViews = buildTrophySetViews(profile?.trophySets ?? [], trophies);

    const games: PsGameView[] = (profile?.games ?? []).map((g) => {
        const sets = g.trophySetIds.map((id) => setViews.get(id)).filter((s): s is PsTrophySetView => Boolean(s));
        return { ...g, trophySets: sets, trophiesEarned: sumCounts(sets.map((s) => s.earned)) };
    });

    const linked = new Set(games.flatMap((g) => g.trophySetIds));
    const otherTrophySets = [...setViews.values()].filter(
        (s) => !linked.has(s.npCommunicationId) && totalTrophies(s.earned) > 0,
    );

    const library = buildLibrary(profile?.library ?? [], profile?.games ?? []);

    // PS4 版と PS5 版で同じトロフィーがあるゲーム (Among Us など) は、レアな方だけ残す
    const seenRare = new Set<string>();
    const rare = trophies
        .filter((t) => t.earnedRate !== undefined && !isNaN(Number(t.earnedRate)))
        .sort((a, b) => Number(a.earnedRate) - Number(b.earnedRate) || (a.date < b.date ? 1 : -1))
        .filter((t) => {
            const key = `${t.conceptId ?? t.npCommunicationId}|${t.title}`;
            if (seenRare.has(key)) return false;
            seenRare.add(key);
            return true;
        })
        .slice(0, 8);

    const summary = profile?.summary ?? null;
    return {
        lastUpdated: profile?.lastUpdated ?? null,
        profile: profile?.profile ?? null,
        summary,
        totals: {
            seconds: games.reduce((s, g) => s + g.seconds, 0),
            games: games.length,
            trophies: summary ? totalTrophies(summary.earned) : trophies.length,
            library: library.length,
            unplayed: library.filter((l) => l.status === "unplayed").length,
        },
        recent: games.slice(0, 4),
        ranking: [...games].sort((a, b) => b.seconds - a.seconds).slice(0, 10),
        games,
        otherTrophySets,
        calendar: buildCalendar(plays, now),
        rare,
        library,
    };
}
