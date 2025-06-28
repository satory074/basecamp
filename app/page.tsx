"use client";

import { 
    ChatBubbleLeftRightIcon, 
    CodeBracketIcon, 
    MusicalNoteIcon, 
    NewspaperIcon,
    SparklesIcon 
} from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import Link from "next/link";
import Sidebar from "./components/Sidebar";

// Dynamic imports for content sections
const HatenaPosts = dynamic(() => import("./components/HatenaPosts"));
const ZennPosts = dynamic(() => import("./components/ZennPosts"));
const GithubPosts = dynamic(() => import("./components/GithubPosts"));
const SoundCloudPlayer = dynamic(() => import("./components/SoundCloudPlayer"));

export default function Home() {
    return (
        <div className="relative min-h-screen">
            {/* Enhanced Hero Section */}
            <div className="relative mb-16 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-gray-900/90 dark:via-slate-800/90 dark:to-gray-900/90" />
                <div className="absolute inset-0">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float animation-delay-300"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-float animation-delay-500"></div>
                </div>
                <div className="relative px-4 py-20 text-center">
                    <div className="flex justify-center mb-8 opacity-0 animate-slideInUp">
                        <div className="relative">
                            <SparklesIcon className="h-16 w-16 text-indigo-600 dark:text-indigo-400 animate-pulse-slow" />
                            <div className="absolute inset-0 h-16 w-16 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                        </div>
                    </div>
                    <h1 className="hero-text-responsive md:text-8xl font-black mb-6 opacity-0 animate-slideInUp animation-delay-100 leading-tight">
                        <span className="text-gradient drop-shadow-lg">
                            Welcome to
                        </span>
                        <br />
                        <span className="text-gradient drop-shadow-lg">
                            Basecamp
                        </span>
                    </h1>
                    <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto opacity-0 animate-slideInUp animation-delay-200 leading-relaxed font-medium">
                        すべてのクリエイティブ活動を一つの場所で<br />
                        <span className="text-lg text-gray-500 dark:text-gray-400">All your creative activities in one place</span>
                    </p>
                    <div className="mt-10 opacity-0 animate-slideInUp animation-delay-300">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button 
                                onClick={() => {
                                    document.querySelector('main')?.scrollIntoView({ 
                                        behavior: 'smooth' 
                                    });
                                }}
                                className="btn-primary px-8 py-4 text-lg cursor-pointer"
                            >
                                探索を始める
                            </button>
                            <Link 
                                href="/github"
                                className="btn-secondary px-8 py-4 text-lg cursor-pointer inline-block text-center"
                            >
                                詳細を見る
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4">
                <div className="flex flex-wrap -mx-4">
                    <main className="w-full lg:w-3/4 px-4">
                        {/* Enhanced Bento Box Grid */}
                        <div className="bento-grid-tablet grid grid-cols-1 md:grid-cols-2 gap-8 auto-rows-fr">
                            {/* Hatena Posts */}
                            <section 
                                className="modern-card glass-card service-card service-card--hatena card-padding-mobile p-8 opacity-0 animate-slideInUp animation-delay-200 group cursor-pointer"
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

                            {/* Zenn Posts */}
                            <section 
                                className="modern-card glass-card service-card service-card--zenn card-padding-mobile p-8 opacity-0 animate-slideInUp animation-delay-300 group cursor-pointer"
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

                            {/* GitHub Activity */}
                            <section 
                                className="modern-card glass-card service-card service-card--github card-padding-mobile p-8 opacity-0 animate-slideInUp animation-delay-400 group cursor-pointer"
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

                            {/* SoundCloud Player - Spans 2 columns on desktop */}
                            <section 
                                className="modern-card glass-card service-card service-card--soundcloud card-padding-mobile p-8 opacity-0 animate-slideInUp animation-delay-500 group cursor-pointer md:col-span-2"
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
                        </div>

                        {/* Enhanced Quick Stats */}
                        <div className="stats-grid-mobile grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 opacity-0 animate-slideInUp animation-delay-600">
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