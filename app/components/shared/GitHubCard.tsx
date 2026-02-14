"use client";

import type { Post } from "../../lib/types";
import { platformColors, defaultPlatformColor } from "@/app/lib/shared/constants";
import { formatRelativeTime } from "@/app/lib/shared/date-utils";
import { WideThumbnail } from "@/app/components/shared/Thumbnail";
import { FeedItemMeta } from "@/app/components/shared/FeedItemMeta";
import { PlatformBadge } from "@/app/components/shared/PlatformBadge";

interface GitHubCardProps {
    post: Post;
}

export function GitHubCard({ post }: GitHubCardProps) {
    const colors = platformColors["github"] || defaultPlatformColor;

    return (
        <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="feed-item-link"
        >
            <WideThumbnail src={post.thumbnail} platform="github" title={post.title} />
            <div className="feed-card-article-content">
                <div className="feed-item-header">
                    <PlatformBadge platform="github" />
                    <span className={`feed-item-platform ${colors.text}`}>
                        GitHub
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
