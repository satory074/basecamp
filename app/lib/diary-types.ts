/**
 * 日記 (デイリーログ) v2 の型定義。
 *
 * Server Component / Client Component / GitHub Actions スクリプトの三者から import されるので
 * ここには型と純粋関数だけを置く (fs / fetch / Next 依存を持ち込まない)。
 */

/** ハイライトの種別。優先度: first > milestone > creation > record > delta > routine */
export type DiaryFactKind = "first" | "milestone" | "creation" | "record" | "delta" | "routine";

/** カード本文に箇条書きで出す 1 行 */
export interface DiaryHighlight {
    kind: DiaryFactKind;
    platform: string;
    icon: string;
    text: string;
    url?: string;
    thumbnail?: string;
}

/** カード下部の stat ピル 1 個 */
export interface DiaryStat {
    key: string;
    icon: string;
    label: string;
    value: string;
}

/** ソース別の日次メトリクス (週次ロールアップ用に保存する。表示には使わない) */
export interface DiaryFacts {
    github?: {
        commits: number;
        repos: { name: string; commits: number; url: string; daysSinceLastPush?: number }[];
        newRepos: { name: string; url: string }[];
        releases: { repo: string; tag: string; url: string }[];
        pushStreakDays: number;
        /** events API が遡れた日数 (最大 ~90)。「N 日以上ぶり」判定の下限に使う */
        historyDays: number;
    };
    articles?: { platform: "zenn" | "hatena" | "note"; title: string; url: string; thumbnail?: string }[];
    x?: { posts: { id: string; text: string; url: string }[]; likes: number; bookmarks: number; reposts: number };
    spotify?: {
        plays: number;
        uniqueTracks: number;
        uniqueArtists: number;
        topArtist?: { name: string; plays: number; thumbnail?: string };
        newArtists: { name: string; plays: number }[];
        avg28d: number;
        max90d: number;
        historyDays: number;
    };
    duolingo?: { xp: number; streak: number; totalXp: number };
    booklog?: {
        finished: { title: string; url: string; rating?: number; nthThisYear: number; thumbnail?: string }[];
        started: { title: string; url: string; thumbnail?: string }[];
        wanted: { title: string; url: string; thumbnail?: string }[];
    };
    filmarks?: {
        watched: { title: string; url: string; type: string; rating?: number; nthThisYear: number; thumbnail?: string }[];
    };
    steam?: { games: DiaryGameFact[]; totalAfter: number };
    playstation?: { games: (DiaryGameFact & { platinum: boolean })[]; totalAfter: number };
    ff14?: { achievements: { title: string; url?: string }[] };
    tenhou?: { games: number; tops: number; lasts: number; points: number; positions: number[] };
    swarm?: { venues: { name: string; isFirst: boolean }[] };
    alco?: { count: number; totalG: number; restDay: boolean; restStreak: number };
}

export interface DiaryGameFact {
    name: string;
    count: number;
    titles: string[];
    isFirst: boolean;
    daysSinceLast?: number;
    icon?: string;
}

/**
 * diary-feed.json の 1 エントリ。
 * v1 (2026-01〜2026-08) は `id/date/title/content` のみ。v2 は `version: 2` を持ち、
 * `title` = headline、`content` = lede + 箇条書き として v1 と同じ読み方ができる。
 */
export interface DiaryEntry {
    id: string;
    date: string;
    title: string;
    content: string;
    version?: 2;
    headline?: string;
    lede?: string;
    ledeSource?: "gemini" | "template" | "none";
    empty?: boolean;
    highlights?: DiaryHighlight[];
    stats?: DiaryStat[];
    thumbnail?: string;
    facts?: DiaryFacts;
}

export interface DiaryFeedData {
    lastUpdated: string;
    entries: DiaryEntry[];
}

/** `Post.data.stats` に入れた stat ピル配列の型ガード (adapter 側で使う) */
export function isDiaryStats(value: unknown): value is DiaryStat[] {
    return (
        Array.isArray(value) &&
        value.every(
            (s) =>
                typeof s === "object" &&
                s !== null &&
                typeof (s as DiaryStat).key === "string" &&
                typeof (s as DiaryStat).icon === "string" &&
                typeof (s as DiaryStat).label === "string" &&
                typeof (s as DiaryStat).value === "string",
        )
    );
}
