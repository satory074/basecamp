"use client";

import type { Post } from "../../lib/types";
import { platformColors, defaultPlatformColor } from "@/app/lib/shared/constants";
import { formatRelativeTime } from "@/app/lib/shared/date-utils";
import { WideThumbnail } from "@/app/components/shared/Thumbnail";
import { PlatformBadge } from "@/app/components/shared/PlatformBadge";
import { FeedItemMeta } from "@/app/components/shared/FeedItemMeta";

const platformDisplayNames: Record<string, string> = {
    hatenabookmark: "Hatena Bookmark",
    hatena: "Hatena",
    zenn: "Zenn",
    note: "Note",
};

interface ArticleCardProps {
    post: Post;
    platform: string;
}

export function ArticleCard({ post, platform }: ArticleCardProps) {
    const colors = platformColors[platform] || defaultPlatformColor;

    return (
        <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="feed-item-link"
        >
            <WideThumbnail src={post.thumbnail} platform={platform} title={post.title} />
            <div className="feed-card-article-content">
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
                {post.description && (
                    <p className="feed-item-description text-gray-500 text-sm mt-1 line-clamp-2">
                        {post.description}
                    </p>
                )}
                <FeedItemMeta post={post} />
            </div>
        </a>
    );
}
