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
    // 音楽
    { name: "SoundCloud", path: "/soundcloud", colorVar: "soundcloud" },
    // 読書
    { name: "Booklog", path: "/booklog", colorVar: "booklog" },
    // 映画
    { name: "Filmarks", path: "/filmarks", colorVar: "filmarks" },
    // ゲーム
    { name: "Tenhou", path: "/tenhou", colorVar: "tenhou" },
    { name: "FF14", path: "/ff14", colorVar: "ff14" },
    { name: "Decks", path: "/decks", colorVar: "decks" },
];

interface SidebarProps {
    activePlatform?: string;
}

export default function Sidebar({ activePlatform }: SidebarProps) {
    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                {/* Back to Home (このSidebarはホーム以外で使用) */}
                <Link
                    href="/"
                    className="text-sm text-gray-400 hover:text-gray-600 mb-6 block"
                >
                    ← Home
                </Link>

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
                <nav className="sidebar-nav" aria-label="プラットフォームナビゲーション">
                    {platforms.map(platform => {
                        const isActive = activePlatform === platform.name.toLowerCase();
                        return (
                            <Link
                                key={platform.name}
                                href={platform.path}
                                className={`sidebar-nav-link ${isActive ? "font-semibold text-black" : ""}`}
                                aria-current={isActive ? "page" : undefined}
                            >
                                <span
                                    className="sidebar-nav-color"
                                    style={{ backgroundColor: `var(--color-${platform.colorVar})` }}
                                    aria-hidden="true"
                                />
                                {platform.name}
                            </Link>
                        );
                    })}
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
    );
}
