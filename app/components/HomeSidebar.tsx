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
    // 語学
    { name: "Duolingo", path: "/duolingo", colorVar: "duolingo" },
    // 音楽
    { name: "SoundCloud", path: "/soundcloud", colorVar: "soundcloud" },
    { name: "Spotify", path: "/spotify", colorVar: "spotify" },
    // 読書
    { name: "Booklog", path: "/booklog", colorVar: "booklog" },
    // 映画
    { name: "Filmarks", path: "/filmarks", colorVar: "filmarks" },
    // ゲーム
    { name: "Steam", path: "/steam", colorVar: "steam" },
    { name: "Tenhou", path: "/tenhou", colorVar: "tenhou" },
    { name: "FF14", path: "/ff14", colorVar: "ff14" },
    { name: "Decks", path: "/decks", colorVar: "decks" },
];

interface HomeSidebarProps {
    stats: {
        articles: number;
        books: number;
        repos: number;
        streak: number;
    };
    bio: string;
}

export default function HomeSidebar({ stats, bio }: HomeSidebarProps) {
    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                {/* Profile */}
                <div className="profile-avatar">
                    <Image
                        src="https://github.com/satory074.png"
                        alt="satory074"
                        width={64}
                        height={64}
                        className="rounded-sm"
                        priority
                    />
                </div>
                <h1 className="profile-name">satory074</h1>
                <p className="profile-title">Creative Developer</p>
                <p className="profile-location">Tokyo, JP</p>

                {bio && <p className="profile-bio">{bio}</p>}

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
                        <span className="sidebar-stat-label">Articles</span>
                        <span className="sidebar-stat-value">{stats.articles}</span>
                    </div>
                    <div className="sidebar-stat">
                        <span className="sidebar-stat-label">Books</span>
                        <span className="sidebar-stat-value">{stats.books}</span>
                    </div>
                    <div className="sidebar-stat">
                        <span className="sidebar-stat-label">Repos</span>
                        <span className="sidebar-stat-value">{stats.repos}</span>
                    </div>
                    {stats.streak > 0 && (
                        <div className="sidebar-stat">
                            <span className="sidebar-stat-label">Streak</span>
                            <span className="sidebar-stat-value">{stats.streak} days</span>
                        </div>
                    )}
                </div>

                {/* Footer in sidebar */}
                <div className="footer hide-mobile">
                    <p>© {new Date().getFullYear()} satory074</p>
                </div>
            </div>
        </aside>
    );
}
