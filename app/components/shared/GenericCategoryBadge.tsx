"use client";

import { platformColors, defaultPlatformColor } from "@/app/lib/shared/constants";
import type { Post } from "../../lib/types";

/** Platform → badge label mapping */
const platformBadgeLabels: Record<string, string | ((post: Post) => string)> = {
    hatena: "記事",
    zenn: "記事",
    note: "記事",
    hatenabookmark: "ブックマーク",
    github: "更新",
    spotify: "再生",
    "ff14-achievement": "アチーブメント",
    booklog: (post: Post) => {
        if (post.description === "読み終わった") return "読了";
        if (post.description === "いま読んでる") return "読中";
        if (post.description === "読みたい") return "読みたい";
        return "読書";
    },
    filmarks: (post: Post) => {
        if (post.category === "ドラマ") return "ドラマ";
        if (post.category === "アニメ") return "アニメ";
        return "映画";
    },
    tenhou: (post: Post) => {
        const title = post.title || "";
        if (title.includes("1着")) return "1着";
        if (title.includes("2着")) return "2着";
        if (title.includes("3着")) return "3着";
        if (title.includes("4着")) return "4着";
        return "対局";
    },
    duolingo: (post: Post) => {
        if (post.category === "milestone") return "マイルストーン";
        return "デイリー";
    },
    steam: "実績",
    x: (post: Post) => {
        if (post.category === "repost") return "リポスト";
        if (post.category === "like") return "いいね";
        if (post.category === "bookmark") return "ブックマーク";
        return "投稿";
    },
};

/** Tenhou position colors */
const tenhouPositionColors: Record<string, string> = {
    "1着": "#FFD700",
    "2着": "#C0C0C0",
    "3着": "#CD7F32",
    "4着": "#666666",
};

function getBadgeLabel(platform: string, post: Post): string {
    const labelOrFn = platformBadgeLabels[platform];
    if (!labelOrFn) return "";
    if (typeof labelOrFn === "function") return labelOrFn(post);
    return labelOrFn;
}

interface GenericCategoryBadgeProps {
    platform: string;
    post: Post;
}

export function GenericCategoryBadge({ platform, post }: GenericCategoryBadgeProps) {
    const label = getBadgeLabel(platform, post);
    if (!label) return null;

    const colors = platformColors[platform] || defaultPlatformColor;
    const bgColor = platform === "tenhou"
        ? (tenhouPositionColors[label] || colors.color)
        : colors.color;

    return (
        <span
            className="generic-category-badge"
            style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: bgColor,
                color: "white",
                flexShrink: 0,
                marginTop: 12,
                fontSize: "0.5rem",
                fontWeight: 700,
                lineHeight: 1,
            }}
            title={label}
            aria-label={label}
        >
            {label.charAt(0)}
        </span>
    );
}
