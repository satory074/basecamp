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
import AsyncWidgetWrapper from "./components/AsyncWidgetWrapper";

// Dynamic imports for content sections with loading optimization
const HatenaPosts = dynamic(() => import("./components/HatenaPosts"), {
    ssr: false
});
const ZennPosts = dynamic(() => import("./components/ZennPosts"), {
    ssr: false
});
const GithubPosts = dynamic(() => import("./components/GithubPosts"), {
    ssr: false
});
const SoundCloudPlayer = dynamic(() => import("./components/SoundCloudPlayer"), {
    ssr: false
});
const BooklogPosts = dynamic(() => import("./components/BooklogPosts"), {
    ssr: false
});
const TenhouStats = dynamic(() => import("./components/TenhouStats"), {
    ssr: false
});
const FF14Character = dynamic(() => import("./components/FF14Character"), {
    ssr: false
});

export default function Home() {
    // アクセシビリティ対応のナビゲーション関数
    const handleCardNavigation = (url: string) => (e: React.MouseEvent | React.KeyboardEvent) => {
        if ('key' in e) {
            // キーボードイベントの場合
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = url;
            }
        } else {
            // マウスイベントの場合
            const target = e.target as HTMLElement;
            if (!target.closest('a')) {
                window.location.href = url;
            }
        }
    };

    return (
        <div className="relative min-h-screen">
            {/* Simple Header Section */}
            <section className="py-8 text-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Basecamp
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        すべてのクリエイティブ活動を一つの場所で
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4">
                <div className="flex flex-wrap -mx-4">
                    <main id="main-content" className="w-full lg:w-3/4 px-4">
                        {/* Wabi-Sabi Single Column Flow */}
                        <div className="wabi-flow space-y-16 md:space-y-20 lg:space-y-24">
                            {/* Hatena Posts - Primary Content */}
                            <section 
                                className="glass-card-enhanced service-card service-card--hatena card-padding-mobile p-8 time-fade-1 opacity-0 animate-slideInUp animation-delay-200 group cursor-pointer"
                                onClick={handleCardNavigation('/hatena')}
                                onKeyDown={handleCardNavigation('/hatena')}
                                role="button"
                                tabIndex={0}
                                aria-label="Hatena Blogの記事一覧へ移動"
                            >
                                <div className="card-header flex justify-between items-start">
                                    <div className="flex items-center">
                                        <div className="relative p-3 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300">
                                            <NewspaperIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                                                Hatena Blog
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">技術記事とエッセイ</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/hatena"
                                        className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-300"
                                    >
                                        すべて見る →
                                    </Link>
                                </div>
                                <div className="card-content">
                                    <AsyncWidgetWrapper skeletonVariant="post">
                                        <HatenaPosts />
                                    </AsyncWidgetWrapper>
                                </div>
                            </section>

                            {/* Ma Space - 視線を休める場所 */}
                            <div className="ma-space"></div>
                            
                            {/* Zenn Posts - Secondary Content */}
                            <section 
                                className="glass-card-enhanced service-card service-card--zenn card-padding-mobile p-7 time-fade-2 opacity-0 animate-slideInUp animation-delay-300 group cursor-pointer"
                                onClick={handleCardNavigation('/zenn')}
                                onKeyDown={handleCardNavigation('/zenn')}
                                role="button"
                                tabIndex={0}
                                aria-label="Zenn記事一覧へ移動"
                            >
                                <div className="card-header flex justify-between items-start">
                                    <div className="flex items-center">
                                        <div className="relative p-3 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300">
                                            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                                Zenn Articles
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">技術記事とチュートリアル</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/zenn"
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300"
                                    >
                                        すべて見る →
                                    </Link>
                                </div>
                                <div className="card-content">
                                    <AsyncWidgetWrapper skeletonVariant="post">
                                        <ZennPosts />
                                    </AsyncWidgetWrapper>
                                </div>
                            </section>

                            {/* GitHub Activity - Code Portfolio */}
                            <section 
                                className="glass-card-enhanced service-card service-card--github card-padding-mobile p-6 time-fade-2 opacity-0 animate-slideInUp animation-delay-400 group cursor-pointer"
                                onClick={handleCardNavigation('/github')}
                                onKeyDown={handleCardNavigation('/github')}
                                role="button"
                                tabIndex={0}
                                aria-label="GitHubプロジェクト一覧へ移動"
                            >
                                <div className="card-header flex justify-between items-start">
                                    <div className="flex items-center">
                                        <div className="relative p-3 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800/30 dark:to-slate-800/30 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300">
                                            <CodeBracketIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                                                GitHub Projects
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">オープンソースプロジェクト</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/github"
                                        className="text-xs font-semibold text-gray-700 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-200 transition-colors duration-300"
                                    >
                                        すべて見る →
                                    </Link>
                                </div>
                                <div className="card-content">
                                    <AsyncWidgetWrapper skeletonVariant="post">
                                        <GithubPosts />
                                    </AsyncWidgetWrapper>
                                </div>
                            </section>

                            {/* Ma Space - 呼吸の間 */}
                            <div className="ma-space"></div>
                            
                            {/* SoundCloud Player - Creative Expression */}
                            <section 
                                className="glass-card-enhanced service-card service-card--soundcloud card-padding-mobile p-6 time-fade-3 opacity-0 animate-slideInUp animation-delay-500 group cursor-pointer"
                                onClick={handleCardNavigation('/soundcloud')}
                                onKeyDown={handleCardNavigation('/soundcloud')}
                                role="button"
                                tabIndex={0}
                                aria-label="SoundCloudトラック一覧へ移動"
                            >
                                <div className="card-header flex justify-between items-start">
                                    <div className="flex items-center">
                                        <div className="relative p-3 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300">
                                            <MusicalNoteIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                                                SoundCloud Tracks
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">音楽とポッドキャスト</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/soundcloud"
                                        className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-300"
                                    >
                                        すべて聴く →
                                    </Link>
                                </div>
                                <div className="card-content">
                                    <AsyncWidgetWrapper skeletonVariant="widget">
                                        <SoundCloudPlayer />
                                    </AsyncWidgetWrapper>
                                </div>
                            </section>

                            {/* Booklog Posts - Knowledge Collection */}
                            <section 
                                className="glass-card-enhanced service-card service-card--booklog card-padding-mobile p-6 time-fade-3 opacity-0 animate-slideInUp animation-delay-550 group cursor-pointer"
                                onClick={handleCardNavigation('/booklog')}
                                onKeyDown={handleCardNavigation('/booklog')}
                                role="button"
                                tabIndex={0}
                                aria-label="読書記録一覧へ移動"
                            >
                                <div className="card-header flex justify-between items-start">
                                    <div className="flex items-center">
                                        <div className="relative p-3 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300">
                                            <BookOpenIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300">
                                                読書記録
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">ブクログで管理</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/booklog"
                                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors duration-300"
                                    >
                                        すべて見る →
                                    </Link>
                                </div>
                                <div className="card-content">
                                    <AsyncWidgetWrapper skeletonVariant="post">
                                        <BooklogPosts limit={3} />
                                    </AsyncWidgetWrapper>
                                </div>
                            </section>

                            {/* Tenhou Stats - Game Mastery */}
                            <section 
                                className="glass-card-enhanced service-card service-card--tenhou card-padding-mobile p-6 time-fade-4 opacity-0 animate-slideInUp animation-delay-600 group cursor-pointer"
                                onClick={handleCardNavigation('/tenhou')}
                                onKeyDown={handleCardNavigation('/tenhou')}
                                role="button"
                                tabIndex={0}
                                aria-label="天鳳戦績詳細へ移動"
                            >
                                <div className="card-header flex justify-between items-start">
                                    <div className="flex items-center">
                                        <div className="relative p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300">
                                            <svg className="h-6 w-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                                                <circle cx="8" cy="9" r="1.5" fill="currentColor"/>
                                                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                                                <circle cx="16" cy="15" r="1.5" fill="currentColor"/>
                                                <path d="M8 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                                                天鳳戦績
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">オンライン麻雀</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/tenhou"
                                        className="text-xs font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors duration-300"
                                    >
                                        詳細を見る →
                                    </Link>
                                </div>
                                <div className="card-content">
                                    <AsyncWidgetWrapper skeletonVariant="widget">
                                        <TenhouStats />
                                    </AsyncWidgetWrapper>
                                </div>
                            </section>

                            {/* Ma Space - 最後の静寂 */}
                            <div className="ma-space"></div>
                            
                            {/* FF14 Character - Virtual Journey */}
                            <section 
                                className="glass-card-enhanced service-card service-card--ff14 card-padding-mobile p-6 time-fade-5 opacity-0 animate-slideInUp animation-delay-650 group cursor-pointer"
                                onClick={handleCardNavigation('/ff14')}
                                onKeyDown={handleCardNavigation('/ff14')}
                                role="button"
                                tabIndex={0}
                                aria-label="FF14キャラクター詳細へ移動"
                            >
                                <div className="card-header flex justify-between items-start">
                                    <div className="flex items-center">
                                        <div className="relative p-3 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300">
                                            <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2L14.5 7L20 7.5L16 11.5L17 17L12 14.5L7 17L8 11.5L4 7.5L9.5 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                                <circle cx="12" cy="20" r="1.5" fill="currentColor"/>
                                                <path d="M6 19L18 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                                                FF14
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">光の戦士として</p>
                                        </div>
                                    </div>
                                    <Link 
                                        href="/ff14"
                                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors duration-300"
                                    >
                                        詳細を見る →
                                    </Link>
                                </div>
                                <div className="card-content">
                                    <AsyncWidgetWrapper skeletonVariant="widget">
                                        <FF14Character compact={true} />
                                    </AsyncWidgetWrapper>
                                </div>
                            </section>
                        </div>

                        {/* Modern Quick Stats */}
                        <div className="stats-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6 mt-16 opacity-0 animate-slideInUp animation-delay-600">
                            {[
                                { label: "ブログ記事", value: "50+", color: "text-orange-600", bgColor: "from-orange-500/10 to-red-500/10", hoverColor: "hover:text-orange-700", href: "/hatena" },
                                { label: "技術記事", value: "30+", color: "text-blue-600", bgColor: "from-blue-500/10 to-cyan-500/10", hoverColor: "hover:text-blue-700", href: "/zenn" },
                                { label: "リポジトリ", value: "20+", color: "text-gray-700", bgColor: "from-gray-500/10 to-slate-500/10", hoverColor: "hover:text-gray-800", href: "/github" },
                                { label: "音楽トラック", value: "10+", color: "text-orange-600", bgColor: "from-orange-500/10 to-red-500/10", hoverColor: "hover:text-orange-700", href: "/soundcloud" },
                                { label: "読書記録", value: "100+", color: "text-amber-600", bgColor: "from-amber-500/10 to-yellow-500/10", hoverColor: "hover:text-amber-700", href: "/booklog" },
                                { label: "ゲーム戦績", value: "Active", color: "text-green-600", bgColor: "from-green-500/10 to-emerald-500/10", hoverColor: "hover:text-green-700", href: "/tenhou" },
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
                        <div className="lg:sidebar-sticky lg:sticky lg:top-8">
                            <AsyncWidgetWrapper skeletonVariant="widget">
                                <Sidebar />
                            </AsyncWidgetWrapper>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}