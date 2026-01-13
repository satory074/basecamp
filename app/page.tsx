"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Post } from "./lib/types";

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

// サイドバーのプラットフォームリンク
const platforms = [
    { name: "GitHub", path: "/github", color: "hover:text-gray-600" },
    { name: "Hatena", path: "/hatena", color: "hover:text-red-500" },
    { name: "Zenn", path: "/zenn", color: "hover:text-cyan-500" },
    { name: "SoundCloud", path: "/soundcloud", color: "hover:text-orange-500" },
    { name: "Booklog", path: "/booklog", color: "hover:text-amber-600" },
    { name: "Tenhou", path: "/tenhou", color: "hover:text-green-600" },
    { name: "FF14", path: "/ff14", color: "hover:text-blue-500" },
];

interface ContentItem {
    id: string;
    title: string;
    url: string;
    platform: string;
    date: string;
}

export default function Home() {
    const [posts, setPosts] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllContent = async () => {
            try {
                const [hatenaRes, zennRes, githubRes] = await Promise.all([
                    fetch("/api/hatena").then(r => r.json()).catch(() => []),
                    fetch("/api/zenn").then(r => r.json()).catch(() => []),
                    fetch("/api/github").then(r => r.json()).catch(() => []),
                ]);

                const allPosts: ContentItem[] = [
                    ...hatenaRes.map((p: Post) => ({ ...p, platform: "hatena" })),
                    ...zennRes.map((p: Post) => ({ ...p, platform: "zenn" })),
                    ...githubRes.map((p: Post) => ({ ...p, platform: "github" })),
                ];

                // Sort by date, newest first
                allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setPosts(allPosts.slice(0, 20));
            } catch (error) {
                console.error("Failed to fetch content:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllContent();
    }, []);

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
        <div className="split-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-content">
                    {/* Profile */}
                    <div className="profile-avatar" />
                    <h1 className="profile-name">satory074</h1>
                    <p className="profile-title">Creative Developer</p>
                    <p className="profile-location">Tokyo, JP</p>

                    {/* Navigation */}
                    <nav className="sidebar-nav">
                        {platforms.map(platform => (
                            <Link
                                key={platform.name}
                                href={platform.path}
                                className={`sidebar-nav-link ${platform.color}`}
                            >
                                {platform.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Stats */}
                    <div className="sidebar-stats">
                        <div className="sidebar-stat">
                            <span className="sidebar-stat-label">Repos</span>
                            <span className="sidebar-stat-value">20+</span>
                        </div>
                        <div className="sidebar-stat">
                            <span className="sidebar-stat-label">Posts</span>
                            <span className="sidebar-stat-value">50+</span>
                        </div>
                        <div className="sidebar-stat">
                            <span className="sidebar-stat-label">Books</span>
                            <span className="sidebar-stat-value">100+</span>
                        </div>
                    </div>

                    {/* Footer in sidebar */}
                    <div className="footer hide-mobile">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <div className="content-wrapper">
                    <h2 className="section-title">Recent Posts</h2>

                    {loading ? (
                        <div className="py-12 text-center text-muted">Loading...</div>
                    ) : (
                        <div>
                            {posts.map(post => {
                                const colors = platformColors[post.platform] || { dot: "bg-gray-400", text: "" };
                                return (
                                    <a
                                        key={post.id}
                                        href={post.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="feed-item"
                                    >
                                        <div className="feed-item-header">
                                            <div className={`feed-item-dot ${colors.dot}`} />
                                            <span className="feed-item-platform capitalize">
                                                {post.platform}
                                            </span>
                                            <span className="feed-item-time">
                                                • {formatRelativeTime(post.date)}
                                            </span>
                                        </div>
                                        <h3 className="feed-item-title">{post.title}</h3>
                                    </a>
                                );
                            })}
                        </div>
                    )}

                    {/* Load more */}
                    <button className="load-more">
                        さらに読み込む
                    </button>

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
