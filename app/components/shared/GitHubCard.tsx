"use client";

import type { Post } from "../../lib/types";
import { platformColors, defaultPlatformColor } from "@/app/lib/shared/constants";
import { formatRelativeTime } from "@/app/lib/shared/date-utils";
import { FeedItemMeta } from "@/app/components/shared/FeedItemMeta";

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
            <div className="feed-card-github-content">
                <h3 className="feed-item-title">{post.title}</h3>
                {post.description && (
                    <p className="feed-item-description text-gray-500 text-sm mt-1 line-clamp-2">
                        {post.description}
                    </p>
                )}
                <div className="feed-item-header">
                    <span className="feed-item-platform">
                        GitHub
                    </span>
                    <span className="feed-item-time">
                        • {formatRelativeTime(post.date)}
                    </span>
                </div>
                <FeedItemMeta post={post} />
            </div>
        </a>
    );
}
