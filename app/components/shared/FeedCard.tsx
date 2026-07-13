"use client";

import type { ReactNode } from "react";
import { formatDateOnly, formatRelativeTime } from "@/app/lib/shared/date-utils";
import { Thumbnail } from "@/app/components/shared/Thumbnail";

export interface FeedCardProps {
    href: string;
    platform: string;
    platformLabel: string;
    date: string;
    /** 時刻を伏せて日付だけ表示する (Swarm: チェックイン時刻を公開しない) */
    dateOnly?: boolean;
    badge?: { label: string; color?: string };
    thumbnail?: { src?: string; shape?: "square" | "portrait"; alt: string };
    title: string;
    description?: string;
    descriptionClamped?: boolean;
    metaPills?: ReactNode;
    statPills?: ReactNode;
    posInSet?: number;
    setSize?: number;
}

export function FeedCard({
    href,
    platform,
    platformLabel,
    date,
    dateOnly = false,
    badge,
    thumbnail,
    title,
    description,
    descriptionClamped = true,
    metaPills,
    statPills,
    posInSet,
    setSize,
}: FeedCardProps) {
    const showThumbnail = thumbnail !== undefined;

    return (
        <article
            className={`feed-item platform-${platform} feed-item-featured`}
            role="article"
            tabIndex={0}
            aria-posinset={posInSet}
            aria-setsize={setSize}
        >
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="feed-item-link"
            >
                <div className={showThumbnail ? "feed-item-with-thumb" : ""}>
                    {showThumbnail && (
                        <Thumbnail
                            src={thumbnail.src}
                            platform={platform}
                            title={thumbnail.alt}
                            shape={thumbnail.shape ?? "square"}
                        />
                    )}
                    <div className="feed-item-content">
                        <div className="feed-item-header">
                            {badge && (
                                <span
                                    className="feed-item-badge-chip"
                                    style={{ backgroundColor: badge.color }}
                                    aria-label={badge.label}
                                >
                                    {badge.label}
                                </span>
                            )}
                            <span className="feed-item-platform">{platformLabel}</span>
                            <span className="feed-item-time">
                                • {dateOnly ? formatDateOnly(date) : formatRelativeTime(date)}
                            </span>
                        </div>
                        <h3 className="feed-item-title">{title}</h3>
                        {description && (
                            <p className={`feed-item-description${descriptionClamped ? "" : " no-clamp"}`}>
                                {description}
                            </p>
                        )}
                        {statPills && <div className="feed-card-stat-pills">{statPills}</div>}
                        {metaPills}
                    </div>
                </div>
            </a>
        </article>
    );
}
