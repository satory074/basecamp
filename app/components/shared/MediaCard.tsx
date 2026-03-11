"use client";

import { useState } from "react";
import Image from "next/image";
import type { Post } from "../../lib/types";
import { platformColors, defaultPlatformColor } from "@/app/lib/shared/constants";
import { formatRelativeTime } from "@/app/lib/shared/date-utils";
import { FeedItemMeta } from "@/app/components/shared/FeedItemMeta";

const platformDisplayNames: Record<string, string> = {
    booklog: "Booklog",
    filmarks: "Filmarks",
    spotify: "Spotify",
};

interface MediaCardProps {
    post: Post;
    platform: string;
}

function MediaThumbnail({ src, platform, title, isSquare }: {
    src?: string;
    platform: string;
    title: string;
    isSquare: boolean;
}) {
    const [hasError, setHasError] = useState(false);
    const color = platformColors[platform]?.color || "#666";

    if (!src || hasError) {
        return (
            <div
                className={`feed-card-media-thumb${isSquare ? " square" : ""} feed-item-placeholder`}
                style={{ backgroundColor: `${color}15` }}
            >
                <div
                    className="feed-item-placeholder-icon"
                    style={{ backgroundColor: color }}
                />
            </div>
        );
    }

    const isHttp = src.startsWith("http://");

    return (
        <div className={`feed-card-media-thumb${isSquare ? " square" : ""}`}>
            <Image
                src={src}
                alt={title || "サムネイル"}
                width={isSquare ? 100 : 100}
                height={isSquare ? 100 : 140}
                className="feed-card-media-thumb-img"
                onError={() => setHasError(true)}
                unoptimized={isHttp}
                style={{ objectFit: "cover" }}
            />
        </div>
    );
}

export function MediaCard({ post, platform }: MediaCardProps) {
    const colors = platformColors[platform] || defaultPlatformColor;
    const isSquare = platform === "spotify";

    return (
        <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="feed-item-link"
        >
            <div className="feed-card-media-layout">
                <MediaThumbnail
                    src={post.thumbnail}
                    platform={platform}
                    title={post.title}
                    isSquare={isSquare}
                />
                <div className="feed-card-media-content">
                    <h3 className="feed-item-title">{post.title}</h3>
                    <div className="feed-item-header">
                        <span className="feed-item-platform">
                            {platformDisplayNames[platform] || platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </span>
                        <span className="feed-item-time">
                            • {formatRelativeTime(post.date)}
                        </span>
                    </div>
                    <FeedItemMeta post={post} />
                </div>
            </div>
        </a>
    );
}
