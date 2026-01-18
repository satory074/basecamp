"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// サイドバーのプラットフォームリンク
const platforms = [
    { name: "GitHub", path: "/github", color: "hover:text-gray-600" },
    { name: "Hatena", path: "/hatena", color: "hover:text-red-500" },
    { name: "Zenn", path: "/zenn", color: "hover:text-cyan-500" },
    { name: "Note", path: "/note", color: "hover:text-[#41c9b4]" },
    { name: "SoundCloud", path: "/soundcloud", color: "hover:text-orange-500" },
    { name: "Booklog", path: "/booklog", color: "hover:text-amber-600" },
    { name: "Tenhou", path: "/tenhou", color: "hover:text-green-600" },
    { name: "FF14", path: "/ff14", color: "hover:text-blue-500" },
    { name: "Decks", path: "/decks", color: "hover:text-purple-500" },
    { name: "Filmarks", path: "/filmarks", color: "hover:text-yellow-500" },
];

interface SidebarProps {
    activePlatform?: string;
}

export default function Sidebar({ activePlatform }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                {/* Back to Home */}
                {pathname !== "/" && (
                    <Link
                        href="/"
                        className="text-sm text-gray-400 hover:text-gray-600 mb-6 block"
                    >
                        ← Home
                    </Link>
                )}

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
                    {platforms.map(platform => {
                        const isActive = pathname === platform.path || activePlatform === platform.name.toLowerCase();
                        return (
                            <Link
                                key={platform.name}
                                href={platform.path}
                                className={`sidebar-nav-link ${platform.color} ${isActive ? "font-semibold text-black" : ""}`}
                            >
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
