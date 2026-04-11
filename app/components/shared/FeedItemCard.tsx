"use client";

import type { Post } from "../../lib/types";
import { platformColors, defaultPlatformColor } from "@/app/lib/shared/constants";
import { formatRelativeTime } from "@/app/lib/shared/date-utils";
import { Thumbnail, PlaceholderThumbnail } from "@/app/components/shared/Thumbnail";
import { FeedItemMeta } from "@/app/components/shared/FeedItemMeta";

// Platform key → display name for platforms where the key isn't a clean single word
const platformDisplayNames: Record<string, string> = {
    hatenabookmark: "Hatena Bookmark",
    "ff14-achievement": "FF14 Achievement",
    ff14: "FF14",
    soundcloud: "SoundCloud",
    github: "GitHub",
    steam: "Steam",
    diary: "日記",
};

interface FeedItemCardProps {
    post: Post;
    platform: string;
    isFeatured?: boolean;
}

export function FeedItemCard({ post, platform, isFeatured = false }: FeedItemCardProps) {
    const colors = platformColors[platform] || defaultPlatformColor;

    // Booklog/Spotify/Filmarks: description is shown via FeedItemMeta pills instead
    const showDescription = post.description
        && platform !== "booklog"
        && platform !== "spotify"
        && platform !== "filmarks"
        && platform !== "steam";

    return (
        <article
            className={`feed-item platform-${platform}${isFeatured ? " feed-item-featured" : ""}`}
        >
            <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="feed-item-link"
            >
                <div className="feed-item-with-thumb">
                    {post.thumbnail ? (
                        <Thumbnail src={post.thumbnail} platform={platform} title={post.title} />
                    ) : (
                        <PlaceholderThumbnail platform={platform} />
                    )}
                    <div className="feed-item-content">
                        <h3 className="feed-item-title">{post.title}</h3>
                        <div className="feed-item-header">
                            <span className="feed-item-platform">
                                {platformDisplayNames[platform] || platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </span>
                            <span className="feed-item-time">
                                • {formatRelativeTime(post.date)}
                            </span>
                        </div>
                        {showDescription && (
                            <p className="feed-item-description text-gray-500 text-sm mt-1 line-clamp-2">
                                {post.description}
                            </p>
                        )}
                        <FeedItemMeta post={post} />
                    </div>
                </div>
            </a>
        </article>
    );
}
