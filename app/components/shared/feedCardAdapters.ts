import type { ReactNode } from "react";
import { createElement, Fragment } from "react";
import type { Post } from "@/app/lib/types";
import type { FeedCardProps } from "@/app/components/shared/FeedCard";
import { FeedItemMeta } from "@/app/components/shared/FeedItemMeta";
import { platformColors, defaultPlatformColor } from "@/app/lib/shared/constants";

const platformLabels: Record<string, string> = {
    hatena: "Hatena",
    zenn: "Zenn",
    note: "Note",
    hatenabookmark: "Hatena Bookmark",
    github: "GitHub",
    booklog: "Booklog",
    filmarks: "Filmarks",
    spotify: "Spotify",
    naita: "泣いた",
    tenhou: "Tenhou",
    duolingo: "Duolingo",
    soundcloud: "SoundCloud",
    steam: "Steam",
    ff14: "FF14",
    "ff14-achievement": "FF14 Achievement",
    diary: "日記",
    swarm: "Swarm",
    applehealth: "Apple Health",
    decks: "Decks",
};

const portraitPlatforms = new Set(["booklog", "filmarks"]);

/** description は meta pills と重複するので隠したい platform */
const platformsWithoutDescription = new Set(["booklog", "spotify", "filmarks", "steam"]);

/** description を 2 行 clamp せず全文表示する platform (日記など) */
const platformsWithFullDescription = new Set(["diary"]);

const tenhouPositionColors: Record<string, string> = {
    "1着": "#FFD700",
    "2着": "#C0C0C0",
    "3着": "#CD7F32",
    "4着": "#666666",
};

function resolveBadge(platform: string, post: Post): { label: string; color: string } | undefined {
    const colors = platformColors[platform] || defaultPlatformColor;

    switch (platform) {
        case "hatena":
        case "zenn":
        case "note":
            return { label: "記事", color: colors.color };
        case "hatenabookmark":
            return { label: "ブックマーク", color: colors.color };
        case "github":
            return { label: "更新", color: colors.color };
        case "spotify":
            return { label: "再生", color: colors.color };
        case "ff14-achievement":
            return { label: "アチーブメント", color: colors.color };
        case "steam":
            return { label: "実績", color: colors.color };
        case "naita":
            return { label: "泣", color: colors.color };
        case "booklog": {
            const label =
                post.description === "読み終わった" ? "読了" :
                post.description === "いま読んでる" ? "読中" :
                post.description === "読みたい" ? "読みたい" :
                "読書";
            return { label, color: colors.color };
        }
        case "filmarks": {
            const label =
                post.category === "ドラマ" ? "ドラマ" :
                post.category === "アニメ" ? "アニメ" :
                "映画";
            return { label, color: colors.color };
        }
        case "tenhou": {
            const title = post.title || "";
            const positionMatch = title.match(/([1-4]着)/);
            const label = positionMatch ? positionMatch[1] : "対局";
            const color = tenhouPositionColors[label] || colors.color;
            return { label, color };
        }
        case "duolingo": {
            const label = post.category === "milestone" ? "マイルストーン" : "デイリー";
            return { label, color: colors.color };
        }
        case "x": {
            const label =
                post.category === "repost" ? "リポスト" :
                post.category === "like" ? "いいね" :
                post.category === "bookmark" ? "ブックマーク" :
                "投稿";
            return { label, color: colors.color };
        }
        case "applehealth": {
            // category で workout / daily / mood に分岐
            if (post.category === "daily") {
                return { label: "アクティビティ", color: colors.color };
            }
            if (post.category === "mood") {
                const labels = (post as Post & { labels?: string[] }).labels;
                const first = Array.isArray(labels) && labels[0] ? labels[0] : "気分";
                return { label: first, color: colors.color };
            }
            const wt = ((post as Post & { workoutType?: string }).workoutType ?? "").toLowerCase();
            const label =
                wt.includes("run") ? "ランニング" :
                wt.includes("walk") ? "ウォーキング" :
                wt.includes("hik") ? "ハイキング" :
                wt.includes("cycl") || wt.includes("bike") ? "サイクリング" :
                wt.includes("swim") ? "スイミング" :
                wt.includes("yoga") ? "ヨガ" :
                wt.includes("strength") || wt.includes("functional") ? "筋トレ" :
                "ワークアウト";
            return { label, color: colors.color };
        }
        case "diary":
        case "swarm":
        case "soundcloud":
        case "ff14":
        default:
            return undefined;
    }
}

function parseTenhouStats(title: string): { score?: string; room?: string } {
    const result: { score?: string; room?: string } = {};
    const scoreMatch = title.match(/([+-]?\d+\.?\d*pt?)/i);
    if (scoreMatch) result.score = scoreMatch[1];
    if (title.includes("特上")) result.room = "特上";
    else if (title.includes("上級")) result.room = "上級";
    else if (title.includes("鳳凰")) result.room = "鳳凰";
    if (title.includes("東風")) result.room = (result.room || "") + "東風";
    else if (title.includes("東南")) result.room = (result.room || "") + "東南";
    return result;
}

function resolveStatPills(platform: string, post: Post): ReactNode {
    if (platform === "tenhou") {
        const stats = parseTenhouStats(post.title || "");
        const pills: ReactNode[] = [];
        if (stats.score) {
            pills.push(createElement("span", { key: "score", className: "feed-card-stat-pill" }, stats.score));
        }
        if (stats.room) {
            pills.push(createElement("span", { key: "room", className: "feed-card-stat-pill" }, stats.room));
        }
        return pills.length > 0 ? createElement(Fragment, null, ...pills) : undefined;
    }

    if (platform === "applehealth") {
        const pills: ReactNode[] = [];

        if (post.category === "daily") {
            const p = post as Post & { steps?: number; exerciseMinutes?: number; activeKcal?: number };
            if (typeof p.steps === "number" && p.steps > 0) {
                pills.push(createElement("span", { key: "steps", className: "feed-card-stat-pill" }, `👣 ${p.steps.toLocaleString()} 歩`));
            }
            if (typeof p.exerciseMinutes === "number" && p.exerciseMinutes > 0) {
                const min = p.exerciseMinutes;
                const label = min >= 60 ? `${Math.floor(min / 60)}h${min % 60}m` : `${min}分`;
                pills.push(createElement("span", { key: "ex", className: "feed-card-stat-pill" }, `⏱ ${label}`));
            }
            if (typeof p.activeKcal === "number" && p.activeKcal > 0) {
                pills.push(createElement("span", { key: "kcal", className: "feed-card-stat-pill" }, `🔥 ${Math.round(p.activeKcal)} kcal`));
            }
            return pills.length > 0 ? createElement(Fragment, null, ...pills) : undefined;
        }

        if (post.category === "mood") {
            const p = post as Post & { valence?: number; labels?: string[] };
            const v = typeof p.valence === "number" ? p.valence : 0;
            const emoji =
                v <= -0.6 ? "😢" :
                v <= -0.2 ? "😟" :
                v <  0.2  ? "😐" :
                v <  0.6  ? "🙂" :
                "😌";
            const sign = v > 0 ? "+" : "";
            pills.push(createElement("span", { key: "val", className: "feed-card-stat-pill" }, `${emoji} ${sign}${v.toFixed(2)}`));
            // 2 個目以降の labels (badge は先頭のみ表示しているので残りを補う)
            if (Array.isArray(p.labels) && p.labels.length > 1) {
                pills.push(createElement("span", { key: "more", className: "feed-card-stat-pill" }, p.labels.slice(1, 3).join(" · ")));
            }
            return createElement(Fragment, null, ...pills);
        }

        // workout
        const p = post as Post & { distanceKm?: number; durationSeconds?: number; kcal?: number };
        if (typeof p.distanceKm === "number" && p.distanceKm > 0) {
            pills.push(createElement("span", { key: "dist", className: "feed-card-stat-pill" }, `${p.distanceKm.toFixed(2)} km`));
        }
        if (typeof p.durationSeconds === "number" && p.durationSeconds > 0) {
            const min = Math.round(p.durationSeconds / 60);
            const label = min >= 60 ? `${Math.floor(min / 60)}h${min % 60}m` : `${min}分`;
            pills.push(createElement("span", { key: "dur", className: "feed-card-stat-pill" }, `⏱ ${label}`));
        }
        if (typeof p.kcal === "number" && p.kcal > 0) {
            pills.push(createElement("span", { key: "kcal", className: "feed-card-stat-pill" }, `🔥 ${Math.round(p.kcal)} kcal`));
        }
        return pills.length > 0 ? createElement(Fragment, null, ...pills) : undefined;
    }

    if (platform === "duolingo") {
        const pills: ReactNode[] = [];
        if (post.description) {
            const xpMatch = post.description.match(/(\d+)\s*XP/);
            if (xpMatch) {
                pills.push(createElement("span", { key: "xp", className: "feed-card-stat-pill" }, `+${xpMatch[1]} XP`));
            }
            const streakMatch = post.description.match(/(\d+)\s*日/);
            if (streakMatch) {
                pills.push(createElement("span", { key: "streak", className: "feed-card-stat-pill" }, `🔥 ${streakMatch[1]}日`));
            }
        }
        return pills.length > 0 ? createElement(Fragment, null, ...pills) : undefined;
    }

    return undefined;
}

export function adaptPost(post: Post, platform: string, posInSet?: number, setSize?: number): FeedCardProps {
    const platformLabel = platformLabels[platform]
        || platform.charAt(0).toUpperCase() + platform.slice(1);

    const showDescription = post.description && !platformsWithoutDescription.has(platform);
    const description = showDescription ? post.description : undefined;
    const descriptionClamped = !platformsWithFullDescription.has(platform);

    return {
        href: post.url,
        platform,
        platformLabel,
        date: post.date,
        badge: resolveBadge(platform, post),
        thumbnail: {
            src: post.thumbnail,
            shape: portraitPlatforms.has(platform) ? "portrait" : "square",
            alt: post.title,
        },
        title: post.title,
        description,
        descriptionClamped,
        metaPills: createElement(FeedItemMeta, { post }),
        statPills: resolveStatPills(platform, post),
        posInSet,
        setSize,
    };
}
