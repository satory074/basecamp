"use client";

import type { Post } from "../../lib/types";

// GitHub language colors (common languages)
const languageColors: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Rust: "#dea584",
    Go: "#00ADD8",
    Java: "#b07219",
    Ruby: "#701516",
    C: "#555555",
    "C++": "#f34b7d",
    "C#": "#178600",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    Lua: "#000080",
    Dart: "#00B4AB",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    PHP: "#4F5D95",
};

interface FeedItemMetaProps {
    post: Post;
}

export function FeedItemMeta({ post }: FeedItemMetaProps) {
    const pills: React.ReactNode[] = [];

    // GitHub: language + stars
    if (post.platform === "github") {
        if (post.language) {
            const langColor = languageColors[post.language] || "#888";
            pills.push(
                <span key="lang" className="feed-item-meta-pill">
                    <span
                        className="feed-item-meta-pill-dot"
                        style={{ backgroundColor: langColor }}
                    />
                    {post.language}
                </span>
            );
        }
        if (post.stars !== undefined && post.stars > 0) {
            pills.push(
                <span key="stars" className="feed-item-meta-pill">
                    ★ {post.stars}
                </span>
            );
        }
    }

    // Booklog: status
    if (post.platform === "booklog" && post.description) {
        pills.push(
            <span key="status" className="feed-item-meta-pill">
                {post.description}
            </span>
        );
    }

    // Filmarks: rating + contentType
    if (post.platform === "filmarks") {
        if (post.rating !== undefined && post.rating > 0) {
            pills.push(
                <span key="rating" className="feed-item-meta-pill">
                    ★ {post.rating}
                </span>
            );
        }
        if (post.category) {
            pills.push(
                <span key="type" className="feed-item-meta-pill">
                    {post.category}
                </span>
            );
        }
    }

    // Hatena Bookmark: bookmark count
    if (post.platform === "hatenabookmark" && post.likes !== undefined && post.likes > 0) {
        pills.push(
            <span key="bookmarks" className="feed-item-meta-pill">
                {post.likes} users
            </span>
        );
    }

    // Spotify: artist
    if (post.platform === "spotify" && post.description) {
        pills.push(
            <span key="artist" className="feed-item-meta-pill">
                {post.description}
            </span>
        );
    }

    // Steam: game name
    if (post.platform === "steam" && post.description) {
        pills.push(
            <span key="game" className="feed-item-meta-pill">
                {post.description}
            </span>
        );
    }

    if (pills.length === 0) return null;

    return <div className="feed-item-meta-row">{pills}</div>;
}
