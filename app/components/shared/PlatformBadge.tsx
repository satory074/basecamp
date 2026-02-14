"use client";

import { platformColors, defaultPlatformColor } from "@/app/lib/shared/constants";

const platformInitials: Record<string, string> = {
    hatena: "H",
    zenn: "Z",
    github: "G",
    soundcloud: "S",
    booklog: "B",
    note: "N",
    tenhou: "T",
    ff14: "F",
    "ff14-achievement": "F",
    decks: "D",
    filmarks: "F",
    spotify: "S",
    hatenabookmark: "B",
    x: "X",
    duolingo: "D",
};

interface PlatformBadgeProps {
    platform: string;
}

export function PlatformBadge({ platform }: PlatformBadgeProps) {
    const color = (platformColors[platform] || defaultPlatformColor).color;
    const initial = platformInitials[platform] || "?";

    return (
        <span
            className="feed-item-badge"
            style={{ backgroundColor: color }}
            aria-hidden="true"
        >
            {initial}
        </span>
    );
}
