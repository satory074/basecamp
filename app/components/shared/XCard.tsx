"use client";

import type { Post } from "../../lib/types";
import { formatRelativeTime } from "@/app/lib/shared/date-utils";

interface XCardProps {
    post: Post;
}

export function XCard({ post }: XCardProps) {
    return (
        <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="feed-item-link"
        >
            <div className="feed-card-github-content">
                <p className="feed-item-description text-sm line-clamp-3">
                    {post.description || post.title}
                </p>
                <div className="feed-item-header">
                    <span className="feed-item-platform">X</span>
                    <span className="feed-item-time">• {formatRelativeTime(post.date)}</span>
                </div>
            </div>
        </a>
    );
}
