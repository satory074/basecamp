/**
 * 日記 v2: DiaryFacts (数値) → ハイライト候補 (文) と stat ピル。
 *
 * 全て決定論的。ここで作った文が Gemini への唯一の材料になり、カードの箇条書きにもそのまま出る。
 * 優先度: first > milestone > creation > record > delta > routine。
 * 「作ったもの」(記事 / 読了 / commit / 自分の投稿 / 視聴) が「消費」(再生数 / チェックイン) より前に来るように
 * platform 順も固定している。
 */

import type { DiaryFactKind, DiaryFacts, DiaryHighlight, DiaryStat } from "../../../app/lib/diary-types";

export interface FactCandidate extends DiaryHighlight {
    priority: number;
    order: number;
}

const KIND_PRIORITY: Record<DiaryFactKind, number> = {
    first: 100,
    milestone: 90,
    creation: 80,
    record: 70,
    delta: 60,
    routine: 10,
};

/** 同じ kind の中での並び (小さいほど先)。作るもの → 遊ぶもの → 消費するもの */
const PLATFORM_ORDER = [
    "zenn", "hatena", "note", "booklog", "github", "x", "filmarks",
    "steam", "playstation", "ff14-achievement", "tenhou", "spotify", "swarm", "duolingo", "alco",
];

const ARTICLE_LABEL: Record<string, string> = { zenn: "Zenn", hatena: "はてなブログ", note: "note" };

/**
 * 消費系の「初めて」(初めて聴いたアーティスト / 初チェックイン) は作るもの (creation 80) より下、記録 (70) より上。
 * 自分の X 投稿はフィードに tweet 埋め込みで既に出ているので、増加 (60) より下に置いて空きがあるときだけ載せる。
 */
const CONSUMPTION_FIRST_PRIORITY = 75;
const X_POST_PRIORITY = 50;

function fact(
    kind: DiaryFactKind,
    platform: string,
    icon: string,
    text: string,
    extra: { url?: string; thumbnail?: string; priority?: number } = {},
): FactCandidate {
    const orderIndex = PLATFORM_ORDER.indexOf(platform);
    return {
        kind,
        platform,
        icon,
        text,
        url: extra.url || undefined,
        thumbnail: extra.thumbnail || undefined,
        priority: extra.priority ?? KIND_PRIORITY[kind],
        order: orderIndex === -1 ? PLATFORM_ORDER.length : orderIndex,
    };
}

function shortRepo(name: string): string {
    return name.replace(/^[^/]+\//, "");
}

function commitsLabel(n: number): string {
    return `${n} commit${n === 1 ? "" : "s"}`;
}

/** Foursquare のバイリンガル表記 `English Name (日本語名)` は日本語側だけにする */
export function displayVenue(name: string): string {
    const m = name.match(/\(([^()]*[぀-ヿ一-鿿][^()]*)\)\s*$/);
    return m ? m[1].trim() : name.trim();
}

/** 天鳳の着順分布 `1着 1 回・2着 2 回`。1 戦だけなら `2着` */
function placementSummary(positions: number[]): string {
    if (positions.length === 1) return `${positions[0]}着`;
    const counts = [1, 2, 3, 4]
        .map((pos) => ({ pos, n: positions.filter((p) => p === pos).length }))
        .filter((x) => x.n > 0);
    return counts.map((x) => `${x.pos}着 ${x.n} 回`).join("・");
}

function quoteTitles(titles: string[], max: number): string {
    const shown = titles.slice(0, max).map((t) => `「${t}」`).join("");
    const rest = titles.length - max;
    return rest > 0 ? `${shown}ほか ${rest} 件` : shown;
}

function formatPoints(points: number): string {
    return `${points >= 0 ? "+" : ""}${points.toFixed(1)} pt`;
}

export function detectFacts(f: DiaryFacts): { candidates: FactCandidate[]; stats: DiaryStat[] } {
    const c: FactCandidate[] = [];
    const stats: DiaryStat[] = [];

    // ---- GitHub ----
    if (f.github) {
        const g = f.github;
        for (const r of g.newRepos) {
            c.push(fact("first", "github", "💻", `リポジトリ ${shortRepo(r.name)} を作成`, { url: r.url }));
        }
        for (const r of g.releases) {
            c.push(fact("milestone", "github", "💻", `${shortRepo(r.repo)} で ${r.tag || "新バージョン"} をリリース`, { url: r.url }));
        }
        const regular: typeof g.repos = [];
        for (const r of g.repos) {
            if (r.daysSinceLastPush !== undefined && r.daysSinceLastPush >= 30) {
                c.push(fact("first", "github", "💻", `${shortRepo(r.name)} に ${r.daysSinceLastPush} 日ぶりの commit（${commitsLabel(r.commits)}）`, { url: r.url }));
            } else if (r.daysSinceLastPush === undefined && g.historyDays >= 30 && !g.newRepos.some((n) => n.name === r.name)) {
                c.push(fact("first", "github", "💻", `${shortRepo(r.name)} に ${g.historyDays} 日以上ぶりの commit（${commitsLabel(r.commits)}）`, { url: r.url }));
            } else {
                regular.push(r);
            }
        }
        if (regular.length > 0) {
            const shown = regular.slice(0, 3).map((r) => `${shortRepo(r.name)} に ${commitsLabel(r.commits)}`).join("、");
            const rest = regular.length - 3;
            const streak = g.pushStreakDays >= 2 ? `（連続 ${g.pushStreakDays} 日目）` : "";
            c.push(fact("creation", "github", "💻", `${shown}${rest > 0 ? `、ほか ${rest} repo` : ""}${streak}`, { url: regular[0].url }));
        }
        if (g.commits > 0) {
            stats.push({
                key: "github",
                icon: "💻",
                label: "GitHub",
                value: g.repos.length > 1 ? `${commitsLabel(g.commits)} / ${g.repos.length} repos` : commitsLabel(g.commits),
            });
        }
    }

    // ---- 記事 ----
    for (const a of (f.articles ?? []).slice(0, 3)) {
        c.push(fact("creation", a.platform, "✍️", `${ARTICLE_LABEL[a.platform] ?? a.platform}「${a.title}」を公開`, { url: a.url, thumbnail: a.thumbnail }));
    }

    // ---- X ----
    if (f.x) {
        for (const p of f.x.posts.slice(0, 2)) {
            c.push(fact("creation", "x", "💬", `投稿「${p.text}」`, { url: p.url, priority: X_POST_PRIORITY }));
        }
        const parts = [
            f.x.posts.length > 0 ? `投稿 ${f.x.posts.length}` : "",
            f.x.reposts > 0 ? `リポスト ${f.x.reposts}` : "",
            f.x.likes > 0 ? `いいね ${f.x.likes}` : "",
            f.x.bookmarks > 0 ? `ブクマ ${f.x.bookmarks}` : "",
        ].filter(Boolean);
        if (parts.length > 0) stats.push({ key: "x", icon: "💬", label: "X", value: parts.join(" · ") });
    }

    // ---- Booklog ----
    if (f.booklog) {
        for (const b of f.booklog.finished) {
            const kind: DiaryFactKind = b.rating === 5 || b.nthThisYear % 10 === 0 ? "milestone" : "creation";
            const rating = b.rating ? `、★${b.rating}` : "";
            c.push(fact(kind, "booklog", "📚", `『${b.title}』を読了（今年 ${b.nthThisYear} 冊目${rating}）`, { url: b.url, thumbnail: b.thumbnail }));
        }
        for (const b of f.booklog.started.slice(0, 2)) {
            c.push(fact("routine", "booklog", "📚", `『${b.title}』を読み始めた`, { url: b.url, thumbnail: b.thumbnail }));
        }
        for (const b of f.booklog.wanted.slice(0, 2)) {
            c.push(fact("routine", "booklog", "📚", `『${b.title}』を「読みたい」に追加`, { url: b.url, thumbnail: b.thumbnail }));
        }
    }

    // ---- Filmarks ----
    for (const m of f.filmarks?.watched ?? []) {
        const kind: DiaryFactKind = m.rating === 5 ? "milestone" : "creation";
        const rating = m.rating ? ` ★${m.rating}` : "";
        c.push(fact(kind, "filmarks", "🎬", `『${m.title}』（${m.type}）を観た${rating}（今年 ${m.nthThisYear} 本目）`, { url: m.url, thumbnail: m.thumbnail }));
    }

    // ---- ゲーム実績 ----
    let achievementTotal = 0;
    const gamePlatforms: { key: "steam" | "playstation"; label: string; unit: string }[] = [
        { key: "steam", label: "Steam", unit: "実績" },
        { key: "playstation", label: "PlayStation", unit: "トロフィー" },
    ];
    for (const gp of gamePlatforms) {
        const data = f[gp.key];
        if (!data) continue;
        for (const g of data.games) {
            achievementTotal += g.count;
            if ("platinum" in g && g.platinum) {
                c.push(fact("milestone", gp.key, "🏆", `${g.name} でプラチナトロフィー獲得`, { thumbnail: g.icon }));
            }
            if (g.isFirst) {
                const more = g.count > 1 ? `ほか ${g.count - 1} 件` : "";
                c.push(fact("first", gp.key, "🎮", `${g.name} で初${gp.unit}「${g.titles[0]}」${more}`, { thumbnail: g.icon }));
            } else if (g.daysSinceLast !== undefined && g.daysSinceLast >= 30) {
                c.push(fact("first", gp.key, "🎮", `${g.name} を ${g.daysSinceLast} 日ぶりにプレイ（${gp.unit} ${g.count} 件）`, { thumbnail: g.icon }));
            } else {
                c.push(fact("routine", gp.key, "🎮", `${g.name} で${gp.unit} ${g.count} 件：${quoteTitles(g.titles, 2)}`, { thumbnail: g.icon }));
            }
        }
        if (data.totalAfter > 0 && data.totalAfter % 25 === 0) {
            c.push(fact("milestone", gp.key, "🏆", `${gp.label} ${gp.unit} 累計 ${data.totalAfter} 件`));
        }
    }
    if (f.ff14) {
        achievementTotal += f.ff14.achievements.length;
        c.push(fact("routine", "ff14-achievement", "🎮", `FF14 アチーブメント ${quoteTitles(f.ff14.achievements.map((a) => a.title), 2)}`, { url: f.ff14.achievements[0]?.url }));
    }
    if (achievementTotal > 0) {
        stats.push({ key: "achievements", icon: "🎮", label: "実績", value: `${achievementTotal} 件` });
    }

    // ---- Duolingo ----
    if (f.duolingo) {
        const d = f.duolingo;
        if (d.xp > 0 && d.streak > 0 && d.streak % 50 === 0) {
            c.push(fact("milestone", "duolingo", "🔥", `Duolingo ${d.streak} 日連続を達成`));
        }
        const prevTotal = d.totalXp - d.xp;
        if (d.xp > 0 && Math.floor(d.totalXp / 1000) > Math.floor(prevTotal / 1000)) {
            c.push(fact("milestone", "duolingo", "🔥", `Duolingo 総 XP が ${(Math.floor(d.totalXp / 1000) * 1000).toLocaleString("en-US")} を突破`));
        }
        if (d.streak > 0) {
            stats.push({ key: "duolingo", icon: "🔥", label: "Duolingo", value: `${d.streak}日${d.xp > 0 ? ` · +${d.xp} XP` : ""}` });
        }
    }

    // ---- Spotify ----
    if (f.spotify) {
        const s = f.spotify;
        for (const a of s.newArtists.slice(0, 2)) {
            c.push(fact("first", "spotify", "🎵", `${a.name} を初めて聴いた（${a.plays} 回）`, { priority: CONSUMPTION_FIRST_PRIORITY }));
        }
        const top = s.topArtist && s.topArtist.plays >= 3 ? ` — ${s.topArtist.name} が最多` : "";
        if (s.plays >= 10 && s.max90d > 0 && s.plays > s.max90d) {
            c.push(fact("record", "spotify", "📈", `Spotify ${s.plays} 曲再生（90 日で最多）${top}`, { thumbnail: s.topArtist?.thumbnail }));
        } else if (s.plays >= 10 && s.avg28d > 0 && s.plays >= s.avg28d * 2) {
            c.push(fact("delta", "spotify", "📈", `Spotify ${s.plays} 曲再生（28 日平均 ${s.avg28d}）${top}`, { thumbnail: s.topArtist?.thumbnail }));
        }
        stats.push({ key: "spotify", icon: "🎵", label: "Spotify", value: `${s.plays}曲` });
    }

    // ---- 天鳳 ----
    if (f.tenhou) {
        const t = f.tenhou;
        c.push(fact("creation", "tenhou", "🀄", `天鳳 ${t.games} 戦：${placementSummary(t.positions)}（${formatPoints(t.points)}）`));
        stats.push({ key: "tenhou", icon: "🀄", label: "天鳳", value: `${t.games} 戦` });
    }

    // ---- Swarm ----
    if (f.swarm) {
        const firsts = f.swarm.venues.filter((v) => v.isFirst);
        const known = f.swarm.venues.filter((v) => !v.isFirst);
        for (const v of firsts.slice(0, 2)) {
            c.push(fact("first", "swarm", "📍", `${displayVenue(v.name)} に初チェックイン`, { priority: CONSUMPTION_FIRST_PRIORITY }));
        }
        if (known.length > 0) {
            const rest = known.length - 3;
            c.push(fact("routine", "swarm", "📍", `チェックイン：${known.slice(0, 3).map((v) => displayVenue(v.name)).join("、")}${rest > 0 ? ` ほか ${rest} 箇所` : ""}`));
        }
        stats.push({ key: "swarm", icon: "📍", label: "Swarm", value: `${f.swarm.venues.length} 箇所` });
    }

    // ---- 飲酒記録 ----
    if (f.alco) {
        const a = f.alco;
        if (a.restDay) {
            if ([7, 14, 30, 60, 100].includes(a.restStreak)) {
                c.push(fact("milestone", "alco", "🍺", `休肝日 ${a.restStreak} 日連続`));
            }
            stats.push({ key: "alco", icon: "🍺", label: "休肝日", value: `${a.restStreak} 日目` });
        } else {
            stats.push({ key: "alco", icon: "🍺", label: "飲酒", value: `${a.count} 杯 · ${Math.round(a.totalG)}g` });
        }
    }

    return { candidates: c, stats: orderStats(stats) };
}

const STAT_ORDER = ["duolingo", "github", "spotify", "alco", "x", "achievements", "swarm", "tenhou"];

function orderStats(stats: DiaryStat[]): DiaryStat[] {
    return [...stats].sort((a, b) => {
        const ia = STAT_ORDER.indexOf(a.key);
        const ib = STAT_ORDER.indexOf(b.key);
        return (ia === -1 ? STAT_ORDER.length : ia) - (ib === -1 ? STAT_ORDER.length : ib);
    });
}
