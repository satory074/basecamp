"use client";

import { 
    ChatBubbleLeftRightIcon, 
    CodeBracketIcon, 
    MusicalNoteIcon, 
    NewspaperIcon,
} from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import Link from "next/link";
import Sidebar from "./components/Sidebar";

// Dynamic imports for content sections
const HatenaPosts = dynamic(() => import("./components/HatenaPosts"));
const ZennPosts = dynamic(() => import("./components/ZennPosts"));
const GithubPosts = dynamic(() => import("./components/GithubPosts"));
const SoundCloudPlayer = dynamic(() => import("./components/SoundCloudPlayer"));
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