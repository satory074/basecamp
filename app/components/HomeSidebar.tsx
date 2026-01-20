import Link from "next/link";
import Image from "next/image";

// サイドバーのプラットフォームリンク（カテゴリ別）
const platforms = [
    // 開発
    { name: "GitHub", path: "/github", colorVar: "github" },
    // ブログ
    { name: "Hatena", path: "/hatena", colorVar: "hatena" },
    { name: "Zenn", path: "/zenn", colorVar: "zenn" },
    { name: "Note", path: "/note", colorVar: "note" },
    { name: "Hatena Bookmark", path: "/hatenabookmark", colorVar: "hatenabookmark" },
    // SNS
    { name: "X", path: "/x", colorVar: "x" },
    // 音楽
    { name: "SoundCloud", path: "/soundcloud", colorVar: "soundcloud" },
    { name: "Spotify", path: "/spotify", colorVar: "spotify" },
    // 読書
    { name: "Booklog", path: "/booklog", colorVar: "booklog" },
    // 映画
    { name: "Filmarks", path: "/filmarks", colorVar: "filmarks" },
    // ゲーム
    { name: "Tenhou", path: "/tenhou", colorVar: "tenhou" },
    { name: "FF14", path: "/ff14", colorVar: "ff14" },
    { name: "Decks", path: "/decks", colorVar: "decks" },
];

interface HomeSidebarProps {
    stats: {
        posts: number;
        books: number;
    };
}

export default function HomeSidebar({ stats }: HomeSidebarProps) {
    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                {/* Profile */}
                <div className="profile-avatar">
                    <Image
                        src="https://github.com/satory074.png"
                        alt="satory074"
                        width={48}
                        height={48}
                        className="rounded-sm"
                        priority
                    />
                </div>
                <h1 className="profile-name">satory074</h1>
                <p className="profile-title">Creative Developer</p>
                <p className="profile-location">Tokyo, JP</p>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {platforms.map(platform => (
                        <Link
                            key={platform.name}
                            href={platform.path}
                            className="sidebar-nav-link"
                        >
                            <span
                                className="sidebar-nav-color"
                                style={{ backgroundColor: `var(--color-${platform.colorVar})` }}
                            />
                            {platform.name}
                        </Link>
                    ))}
                </nav>

                {/* Stats */}
                <div className="sidebar-stats">
                    <div className="sidebar-stat">
                        <span className="sidebar-stat-label">Posts</span>
                        <span className="sidebar-stat-value">{stats.posts}</span>
                    </div>
                    <div className="sidebar-stat">
                        <span className="sidebar-stat-label">Books</span>
                        <span className="sidebar-stat-value">{stats.books}</span>
                    </div>
                </div>

                {/* Footer in sidebar */}
                <div className="footer hide-mobile">
                    <p>© 2025 Basecamp</p>
                </div>
            </div>
        </aside>
    );
}
