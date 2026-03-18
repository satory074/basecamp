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

    // Booklog: rating, status, finishedDate, tags, category
    if (post.platform === "booklog") {
        if (post.rating !== undefined && post.rating > 0) {
            pills.push(
                <span key="rating" className="feed-item-meta-pill">
                    {"★".repeat(post.rating)}
                </span>
            );
        }
        if (post.description) {
            pills.push(
                <span key="status" className="feed-item-meta-pill">
                    {post.description}
                </span>
            );
        }
        if (post.finishedDate) {
            pills.push(
                <span key="fin" className="feed-item-meta-pill">
                    {post.finishedDate}
                </span>
            );
        }
        if (post.category) {
            pills.push(
                <span key="cat" className="feed-item-meta-pill">
                    {post.category}
                </span>
            );
        }
        post.tags?.slice(0, 3).forEach((tag, i) => {
            pills.push(
                <span key={`tag-${i}`} className="feed-item-meta-pill">
                    {tag}
                </span>
            );
        });
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

    // Naita: mediaType + sourcePlatform + notes
    if (post.platform === "naita") {
        if (post.description) {
            pills.push(
                <span key="mediaType" className="feed-item-meta-pill">
                    {post.description}
                </span>
            );
        }
        if (post.category) {
            pills.push(
                <span key="source" className="feed-item-meta-pill">
                    {post.category}
                </span>
            );
        }
        const notes = (post.data as Record<string, unknown> | undefined)?.notes;
        if (typeof notes === "string" && notes) {
            pills.push(
                <span key="notes" className="feed-item-meta-pill">
                    {notes.length > 20 ? notes.slice(0, 20) + "…" : notes}
                </span>
            );
        }
    }

    if (pills.length === 0) return null;

    return <div className="feed-item-meta-row">{pills}</div>;
}
