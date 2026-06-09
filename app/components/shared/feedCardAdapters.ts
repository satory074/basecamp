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
    tenhou: "Tenhou",
    duolingo: "Duolingo",
    soundcloud: "SoundCloud",
    steam: "Steam",
    playstation: "PlayStation",
    ff14: "FF14",
    "ff14-achievement": "FF14 Achievement",
    diary: "日記",
    swarm: "Swarm",
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

/** PlayStation トロフィー種別 → バッジ表示 (post.category がトロフィー種別) */
const trophyTypeBadges: Record<string, { label: string; color: string }> = {
    platinum: { label: "プラチナ", color: "#5BC0DE" },
    gold: { label: "ゴールド", color: "#FFD700" },
    silver: { label: "シルバー", color: "#C0C0C0" },
    bronze: { label: "ブロンズ", color: "#CD7F32" },
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
        case "playstation": {
            const tier = trophyTypeBadges[post.category ?? ""];
            return tier ?? { label: "トロフィー", color: colors.color };
        }
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
