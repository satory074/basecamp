"use client";

import type { Post } from "../../lib/types";
import { platformColors, defaultPlatformColor } from "@/app/lib/shared/constants";
import { formatRelativeTime } from "@/app/lib/shared/date-utils";
import { Thumbnail, PlaceholderThumbnail } from "@/app/components/shared/Thumbnail";
import { PlatformBadge } from "@/app/components/shared/PlatformBadge";
import { FeedItemMeta } from "@/app/components/shared/FeedItemMeta";

// Platform key → display name for platforms where the key isn't a clean single word
const platformDisplayNames: Record<string, string> = {
    hatenabookmark: "Hatena Bookmark",
    "ff14-achievement": "FF14 Achievement",
    ff14: "FF14",
    soundcloud: "SoundCloud",
    github: "GitHub",
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
        && platform !== "filmarks";

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
                        <div className="feed-item-header">
                            <PlatformBadge platform={platform} />
                            <span className={`feed-item-platform ${colors.text}`}>
                                {platformDisplayNames[platform] || platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </span>
                            <span className="feed-item-time">
                                • {formatRelativeTime(post.date)}
                            </span>
                        </div>
                        <h3 className="feed-item-title">{post.title}</h3>
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
