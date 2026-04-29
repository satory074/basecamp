import Link from "next/link";
import Image from "next/image";
import ProfileLinks from "./shared/ProfileLinks";

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
    {
        label: "作品",
        platforms: [
            { name: "Apps", path: "/apps", colorVar: "apps" },
        ],
    },
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
    const statItems = [
        { label: "Articles", value: stats.articles },
        { label: "Books", value: stats.books },
        { label: "Repos", value: stats.repos },
    ].filter(s => s.value > 0);

    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                {/* Profile */}
                <div className="profile-avatar">
                    <Image
                        src="https://github.com/satory074.png"
                        alt="satory074"
                        width={80}
                        height={80}
                        className="rounded-sm"
                        priority
                    />
                </div>
                <h1 className="profile-name">satory074</h1>
                <p className="profile-title">Creative Developer</p>
                <p className="profile-location">Tokyo, JP</p>

                {bio && (
                    <p className="profile-bio" style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" as const }}>
                        {bio}
                    </p>
                )}

                {/* External profile links */}
                <ProfileLinks />

                {/* Navigation with category groups */}
                <nav className="sidebar-nav" aria-label="プラットフォームナビゲーション">
                    {platformGroups.map(group => (
                        <div key={group.label} className="sidebar-nav-group">
                            <div className="sidebar-nav-group-label">{group.label}</div>
                            {group.platforms.map(platform => (
                                <Link
                                    key={platform.name}
                                    href={platform.path}
                                    className="sidebar-nav-link"
                                >
                                    <span
                                        className="sidebar-nav-color"
                                        style={{ backgroundColor: `var(--color-${platform.colorVar})` }}
                                        aria-hidden="true"
                                    />
                                    {platform.name}
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* Stats — only show items with values */}
                {(statItems.length > 0 || stats.streak > 0) && (
                    <div className="sidebar-stats">
                        {statItems.map(s => (
                            <div key={s.label} className="sidebar-stat">
                                <span className="sidebar-stat-label">{s.label}</span>
                                <span className="sidebar-stat-value">{s.value}</span>
                            </div>
                        ))}
                        {stats.streak > 0 && (
                            <div className="sidebar-stat">
                                <span className="sidebar-stat-label">Streak</span>
                                <span className="sidebar-stat-value">{stats.streak} days</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}
