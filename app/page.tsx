"use client";

import { 
    ChatBubbleLeftRightIcon, 
    CodeBracketIcon, 
    MusicalNoteIcon, 
    NewspaperIcon,
    BookOpenIcon,
} from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import Link from "next/link";
import Sidebar from "./components/Sidebar";

// Dynamic imports for content sections
const HatenaPosts = dynamic(() => import("./components/HatenaPosts"));
const ZennPosts = dynamic(() => import("./components/ZennPosts"));
const GithubPosts = dynamic(() => import("./components/GithubPosts"));
const SoundCloudPlayer = dynamic(() => import("./components/SoundCloudPlayer"));
const BooklogPosts = dynamic(() => import("./components/BooklogPosts"));
const TenhouStats = dynamic(() => import("./components/TenhouStats"));
const FF14Character = dynamic(() => import("./components/FF14Character"));
const ParallaxHero = dynamic(() => import("./components/ParallaxHero"));

export default function Home() {
    return (
        <div className="relative min-h-screen">
            {/* Enhanced Hero Section with Parallax */}
            <ParallaxHero />

            <div className="container mx-auto px-4">
                <div className="flex flex-wrap -mx-4">
                    <main id="main-content" className="w-full lg:w-3/4 px-4">
                        {/* Enhanced Bento Box Grid with Variable Sizes */}
                        <div className="bento-grid grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8 auto-rows-[minmax(200px,auto)]">
                            {/* Hatena Posts - Large Card */}
                            <section 
                                className="glass-card-enhanced service-card service-card--hatena card-padding-mobile p-8 opacity-0 animate-slideInUp animation-delay-200 group cursor-pointer md:col-span-2 md:row-span-2"
                                onClick={(e) => {
                                    // リンク要素以外がクリックされた場合のみナビゲート
                                    const target = e.target as HTMLElement;
                                    if (!target.closest('a')) {
                                        window.location.href = '/hatena';
                                    }
                                }}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center">
                                        <div className="relative p-4 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-300">
                                            <NewspaperIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                            <div className="absolute inset-0 bg-orange-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                                        </div>
                                        <div>
                                            <h2 className="card-title group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                                                Hatena Blog
                                            </h2>
                                            <p className="card-subtitle">技術記事とエッセイ</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/hatena"
                                        className="text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-300 hover:underline"
                                    >
                                        すべて見る →
                                    </Link>
                                </div>
                                <div>
                                    <HatenaPosts />
                                </div>
                            </section>

                            {/* Zenn Posts - Medium Card */}
                            <section 
                                className="glass-card-enhanced service-card service-card--zenn card-padding-mobile p-8 opacity-0 animate-slideInUp animation-delay-300 group cursor-pointer md:col-span-2 md:row-span-1"
                                onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (!target.closest('a')) {
                                        window.location.href = '/zenn';
                                    }
                                }}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center">
                                        <div className="relative p-4 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-300">
                                            <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                            <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                                        </div>
                                        <div>
                                            <h2 className="card-title group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                                Zenn Articles
                                            </h2>
                                            <p className="card-subtitle">技術記事とチュートリアル</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/zenn"
                                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300 hover:underline"
                                    >
                                        すべて見る →
                                    </Link>
                                </div>
                                <div>
                                    <ZennPosts />
                                </div>
                            </section>

                            {/* GitHub Activity - Square Card */}
                            <section 
                                className="glass-card-enhanced service-card service-card--github card-padding-mobile p-8 opacity-0 animate-slideInUp animation-delay-400 group cursor-pointer md:col-span-2 md:row-span-1"
                                onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (!target.closest('a')) {
                                        window.location.href = '/github';
                                    }
                                }}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center">
                                        <div className="relative p-4 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800/30 dark:to-slate-800/30 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-300">
                                            <CodeBracketIcon className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                                            <div className="absolute inset-0 bg-gray-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                                        </div>
                                        <div>
                                            <h2 className="card-title group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                                                GitHub Projects
                                            </h2>
                                            <p className="card-subtitle">オープンソースプロジェクト</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/github"
                                        className="text-sm font-semibold text-gray-700 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-200 transition-colors duration-300 hover:underline"
                                    >
                                        すべて見る →
                                    </Link>
                                </div>
                                <div>
                                    <GithubPosts />
                                </div>
                            </section>

                            {/* SoundCloud Player - Wide Card */}
                            <section 
                                className="glass-card-enhanced service-card service-card--soundcloud card-padding-mobile p-8 opacity-0 animate-slideInUp animation-delay-500 group cursor-pointer md:col-span-4 md:row-span-1"
                                onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (!target.closest('a')) {
                                        window.location.href = '/soundcloud';
                                    }
                                }}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center">
                                        <div className="relative p-4 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-300">
                                            <MusicalNoteIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                            <div className="absolute inset-0 bg-orange-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                                        </div>
                                        <div>
                                            <h2 className="card-title group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                                                SoundCloud Tracks
                                            </h2>
                                            <p className="card-subtitle">音楽とポッドキャスト</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/soundcloud"
                                        className="text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-300 hover:underline"
                                    >
                                        すべて聴く →
                                    </Link>
                                </div>
                                <div>
                                    <SoundCloudPlayer />
                                </div>
                            </section>

                            {/* Booklog Posts - Medium Card */}
                            <section 
                                className="glass-card-enhanced service-card service-card--booklog card-padding-mobile p-8 opacity-0 animate-slideInUp animation-delay-550 group cursor-pointer md:col-span-2 md:row-span-1"
                                onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (!target.closest('a')) {
                                        window.location.href = '/booklog';
                                    }
                                }}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center">
                                        <div className="relative p-4 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-300">
                                            <BookOpenIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                            <div className="absolute inset-0 bg-amber-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                                        </div>
                                        <div>
                                            <h2 className="card-title group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300">
                                                読書記録
                                            </h2>
                                            <p className="card-subtitle">ブクログで管理</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/booklog"
                                        className="text-sm font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors duration-300 hover:underline"
                                    >
                                        すべて見る →
                                    </Link>
                                </div>
                                <div className="card-content">
                                    <BooklogPosts limit={3} />
                                </div>
                            </section>

                            {/* Tenhou Stats - Medium Card */}
                            <section 
                                className="glass-card-enhanced service-card service-card--tenhou card-padding-mobile p-8 opacity-0 animate-slideInUp animation-delay-600 group cursor-pointer md:col-span-2 md:row-span-1"
                                onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (!target.closest('a')) {
                                        window.location.href = '/tenhou';
                                    }
                                }}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center">
                                        <div className="relative p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-300">
                                            <svg className="h-8 w-8 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                                                <circle cx="8" cy="9" r="1.5" fill="currentColor"/>
                                                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                                                <circle cx="16" cy="15" r="1.5" fill="currentColor"/>
                                                <path d="M8 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                            </svg>
                                            <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                                        </div>
                                        <div>
                                            <h2 className="card-title group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                                                天鳳戦績
                                            </h2>
                                            <p className="card-subtitle">オンライン麻雀</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/tenhou"
                                        className="text-sm font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors duration-300 hover:underline"
                                    >
                                        詳細を見る →
                                    </Link>
                                </div>
                                <div className="card-content">
                                    <TenhouStats />
                                </div>
                            </section>

                            {/* FF14 Character - Small Card */}
                            <section 
                                className="glass-card-enhanced service-card service-card--ff14 card-padding-mobile p-8 opacity-0 animate-slideInUp animation-delay-650 group cursor-pointer md:col-span-2 md:row-span-1"
                                onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (!target.closest('a')) {
                                        window.location.href = '/ff14';
                                    }
                                }}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center">
                                        <div className="relative p-4 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-300">
                                            <svg className="h-8 w-8 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2L14.5 7L20 7.5L16 11.5L17 17L12 14.5L7 17L8 11.5L4 7.5L9.5 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                                <circle cx="12" cy="20" r="1.5" fill="currentColor"/>
                                                <path d="M6 19L18 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                            <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                                        </div>
                                        <div>
                                            <h2 className="card-title group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                                                FF14
                                            </h2>
                                            <p className="card-subtitle">光の戦士として</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/ff14"
                                        className="text-sm font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors duration-300 hover:underline"
                                    >
                                        詳細を見る →
                                    </Link>
                                </div>
                                <div className="card-content">
                                    <FF14Character compact={true} />
                                </div>
                            </section>
                        </div>

                        {/* Enhanced Quick Stats */}
                        <div className="stats-grid-mobile grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 mt-16 opacity-0 animate-slideInUp animation-delay-600">
                            {[
                                { label: "ブログ記事", value: "50+", color: "text-orange-600", bgColor: "from-orange-500/10 to-red-500/10", hoverColor: "hover:text-orange-700", href: "/hatena" },
                                { label: "技術記事", value: "30+", color: "text-blue-600", bgColor: "from-blue-500/10 to-cyan-500/10", hoverColor: "hover:text-blue-700", href: "/zenn" },
                                { label: "リポジトリ", value: "20+", color: "text-gray-700", bgColor: "from-gray-500/10 to-slate-500/10", hoverColor: "hover:text-gray-800", href: "/github" },
                                { label: "音楽トラック", value: "10+", color: "text-orange-600", bgColor: "from-orange-500/10 to-red-500/10", hoverColor: "hover:text-orange-700", href: "/soundcloud" },
                            ].map((stat, index) => (
                                <Link 
                                    key={index}
                                    href={stat.href}
                                    className={`block text-center p-8 rounded-2xl bg-gradient-to-br ${stat.bgColor} backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:scale-105 hover:-translate-y-2 transition-all duration-300 group cursor-pointer`}
                                >
                                    <p className={`text-4xl font-black ${stat.color} ${stat.hoverColor} dark:${stat.color.replace('600', '400')} transition-colors duration-300 group-hover:scale-110`}>
                                        {stat.value}
                                    </p>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors duration-300">
                                        {stat.label}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </main>

                    <aside className="w-full lg:w-1/4 px-4 mt-12 lg:mt-0 opacity-0 animate-slideInRight animation-delay-300">
                        <div className="sidebar-sticky sticky top-8">
                            <Sidebar />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}