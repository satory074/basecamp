import Link from "next/link";
import Image from "next/image";

// カテゴリ別プラットフォームリンク
const platformGroups = [
    {
        label: "開発",
        platforms: [
            { name: "GitHub", path: "/github", colorVar: "github" },
        ],
    },
    {
        label: "ブログ・記事",
        platforms: [
            { name: "Hatena", path: "/hatena", colorVar: "hatena" },
            { name: "Zenn", path: "/zenn", colorVar: "zenn" },
            { name: "Note", path: "/note", colorVar: "note" },
            { name: "Hatena Bookmark", path: "/hatenabookmark", colorVar: "hatenabookmark" },
        ],
    },
    {
        label: "SNS",
        platforms: [
            { name: "X", path: "/x", colorVar: "x" },
        ],
    },
    {
        label: "語学・音楽",
        platforms: [
            { name: "Duolingo", path: "/duolingo", colorVar: "duolingo" },
            { name: "SoundCloud", path: "/soundcloud", colorVar: "soundcloud" },
            { name: "Spotify", path: "/spotify", colorVar: "spotify" },
        ],
    },
    {
        label: "読書・映画",
        platforms: [
            { name: "Booklog", path: "/booklog", colorVar: "booklog" },
            { name: "Filmarks", path: "/filmarks", colorVar: "filmarks" },
            { name: "泣いた", path: "/naita", colorVar: "naita" },
        ],
    },
    {
        label: "日記",
        platforms: [
            { name: "日記", path: "/diary", colorVar: "diary" },
        ],
    },
    {
        label: "場所",
        platforms: [
            { name: "Swarm", path: "/swarm", colorVar: "swarm" },
        ],
    },
    {
        label: "ゲーム",
        platforms: [
            { name: "Steam", path: "/steam", colorVar: "steam" },
            { name: "Tenhou", path: "/tenhou", colorVar: "tenhou" },
            { name: "FF14", path: "/ff14", colorVar: "ff14" },
            { name: "Decks", path: "/decks", colorVar: "decks" },
        ],
    },
];

interface SidebarProps {
    activePlatform?: string;
}

export default function Sidebar({ activePlatform }: SidebarProps) {
    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                {/* Back to Home */}
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

                {/* Navigation with category groups */}
                <nav className="sidebar-nav" aria-label="プラットフォームナビゲーション">
                    {platformGroups.map(group => (
                        <div key={group.label} className="sidebar-nav-group">
                            <div className="sidebar-nav-group-label">{group.label}</div>
                            {group.platforms.map(platform => {
                                const isActive = activePlatform === platform.path.slice(1);
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
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
