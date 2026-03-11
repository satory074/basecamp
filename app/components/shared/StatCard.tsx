"use client";

import type { Post } from "../../lib/types";
import { platformColors, defaultPlatformColor } from "@/app/lib/shared/constants";
import { formatRelativeTime } from "@/app/lib/shared/date-utils";

const platformDisplayNames: Record<string, string> = {
    tenhou: "Tenhou",
    duolingo: "Duolingo",
};

/** Tenhou: parse title for position, score, room info */
function parseTenhouStats(title: string): { position?: string; score?: string; room?: string } {
    const result: { position?: string; score?: string; room?: string } = {};
    const posMatch = title.match(/([1-4]着)/);
    if (posMatch) result.position = posMatch[1];
    const scoreMatch = title.match(/([+-]?\d+\.?\d*pt?)/i);
    if (scoreMatch) result.score = scoreMatch[1];
    // Room type from common patterns
    if (title.includes("特上")) result.room = "特上";
    else if (title.includes("上級")) result.room = "上級";
    else if (title.includes("鳳凰")) result.room = "鳳凰";
    // 東/南
    if (title.includes("東風")) result.room = (result.room || "") + "東風";
    else if (title.includes("東南")) result.room = (result.room || "") + "東南";
    return result;
}

const tenhouPositionColors: Record<string, string> = {
    "1着": "#FFD700",
    "2着": "#C0C0C0",
    "3着": "#CD7F32",
    "4着": "#666666",
};

interface StatCardProps {
    post: Post;
    platform: string;
}

export function StatCard({ post, platform }: StatCardProps) {
    const colors = platformColors[platform] || defaultPlatformColor;

    return (
        <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="feed-item-link"
        >
            <h3 className="feed-item-title">{post.title}</h3>
            <div className="feed-item-header">
                <span className="feed-item-platform">
                    {platformDisplayNames[platform] || platform.charAt(0).toUpperCase() + platform.slice(1)}
                </span>
                <span className="feed-item-time">
                    • {formatRelativeTime(post.date)}
                </span>
            </div>
            {post.description && (
                <p className="feed-item-description text-gray-500 text-sm mt-1 line-clamp-2">
                    {post.description}
                </p>
            )}
            <div className="feed-card-stat-pills">
                {platform === "tenhou" && renderTenhouPills(post.title)}
                {platform === "duolingo" && renderDuolingoPills(post)}
            </div>
        </a>
    );
}

function renderTenhouPills(title: string) {
    const stats = parseTenhouStats(title);
    const pills: React.ReactNode[] = [];

    if (stats.position) {
        pills.push(
            <span
                key="position"
                className="feed-card-stat-pill"
                style={{ color: tenhouPositionColors[stats.position] || "#666", fontWeight: 700 }}
            >
                {stats.position}
            </span>
        );
    }
    if (stats.score) {
        pills.push(
            <span key="score" className="feed-card-stat-pill">
                {stats.score}
            </span>
        );
    }
    if (stats.room) {
        pills.push(
            <span key="room" className="feed-card-stat-pill">
                {stats.room}
            </span>
        );
    }

    return pills;
}

function renderDuolingoPills(post: Post) {
    const pills: React.ReactNode[] = [];

    if (post.category) {
        pills.push(
            <span key="category" className="feed-card-stat-pill">
                {post.category === "milestone" ? "マイルストーン" : "デイリー"}
            </span>
        );
    }

    // Extract XP/streak from description if present
    if (post.description) {
        const xpMatch = post.description.match(/(\d+)\s*XP/);
        if (xpMatch) {
            pills.push(
                <span key="xp" className="feed-card-stat-pill">
                    +{xpMatch[1]} XP
                </span>
            );
        }
        const streakMatch = post.description.match(/(\d+)\s*日/);
        if (streakMatch) {
            pills.push(
                <span key="streak" className="feed-card-stat-pill">
                    🔥 {streakMatch[1]}日
                </span>
            );
        }
    }

    return pills;
}
