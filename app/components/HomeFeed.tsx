"use client";

import { Post } from "../lib/types";

// プラットフォーム別の色クラス
const platformColors: Record<string, { dot: string; text: string }> = {
    hatena: { dot: "dot-hatena", text: "text-hatena" },
    zenn: { dot: "dot-zenn", text: "text-zenn" },
    github: { dot: "dot-github", text: "text-github" },
    soundcloud: { dot: "dot-soundcloud", text: "text-soundcloud" },
    booklog: { dot: "dot-booklog", text: "text-booklog" },
    tenhou: { dot: "dot-tenhou", text: "text-tenhou" },
    ff14: { dot: "dot-ff14", text: "text-ff14" },
};

interface ContentItem extends Post {
    platform: string;
}

interface HomeFeedProps {
    initialPosts: ContentItem[];
}

export default function HomeFeed({ initialPosts }: HomeFeedProps) {
    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);

        if (diffHours < 1) return "たった今";
        if (diffHours < 24) return `${diffHours}時間前`;
        if (diffDays < 7) return `${diffDays}日前`;
        if (diffWeeks < 4) return `${diffWeeks}週間前`;
        return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
    };

    return (
        <div>
            {initialPosts.map(post => {
                const colors = platformColors[post.platform] || { dot: "bg-gray-400", text: "", border: "" };
                return (
                    <a
                        key={post.id}
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`feed-item platform-${post.platform}`}
                    >
                        <div className="feed-item-header">
                            <div className={`feed-item-dot ${colors.dot}`} />
                            <span className="feed-item-platform capitalize">
                                {post.platform}
                            </span>
                            <span className="feed-item-time">
                                • {formatRelativeTime(post.date)}
                            </span>
                            {post.stars !== undefined && post.stars > 0 && (
                                <span className="feed-item-meta">
                                    ⭐ {post.stars}
                                </span>
                            )}
                            {post.likes !== undefined && post.likes > 0 && (
                                <span className="feed-item-meta">
                                    ❤️ {post.likes}
                                </span>
                            )}
                            {post.language && (
                                <span className="feed-item-meta text-gray-400">
                                    {post.language}
                                </span>
                            )}
                        </div>
                        <h3 className="feed-item-title">{post.title}</h3>
                        {post.description && (
                            <p className="feed-item-description text-gray-500 text-sm mt-1 line-clamp-2">
                                {post.description}
                            </p>
                        )}
                    </a>
                );
            })}
        </div>
    );
}
