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
            {/* Hero Section */}
            <div className="relative mb-12 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 opacity-50" />
                <div className="relative px-4 py-16 text-center">
                    <div className="flex justify-center mb-6 opacity-0 animate-slideInUp">
                        <SparklesIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-pulse-slow" />
                    </div>
                    <h1 className="text-6xl font-extrabold mb-4 opacity-0 animate-slideInUp animation-delay-100">
                        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Welcome to Basecamp
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto opacity-0 animate-slideInUp animation-delay-200">
                        すべてのクリエイティブ活動を一つの場所で
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4">
                <div className="flex flex-wrap -mx-4">
                    <main className="w-full lg:w-3/4 px-4">
                        {/* Modern Bento Box Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                            {/* Hatena Posts */}
                            <section className="modern-card glass-card service-card service-card--hatena p-8 opacity-0 animate-slideInUp animation-delay-200">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center">
                                        <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-2xl mr-4">
                                            <NewspaperIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                Hatena Blog
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">技術記事とエッセイ</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/hatena"
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                    >
                                        すべて見る →
                                    </Link>
                                </div>
                                <HatenaPosts />
                            </section>

                            {/* Zenn Posts */}
                            <section className="modern-card glass-card service-card service-card--zenn p-8 opacity-0 animate-slideInUp animation-delay-300">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center">
                                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl mr-4">
                                            <ChatBubbleLeftRightIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                Zenn Articles
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">技術記事とチュートリアル</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/zenn"
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                    >
                                        すべて見る →
                                    </Link>
                                </div>
                                <ZennPosts />
                            </section>

                            {/* GitHub Activity */}
                            <section className="modern-card glass-card service-card service-card--github p-8 opacity-0 animate-slideInUp animation-delay-400">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center">
                                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-2xl mr-4">
                                            <CodeBracketIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                GitHub Projects
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">オープンソースプロジェクト</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/github"
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                    >
                                        すべて見る →
                                    </Link>
                                </div>
                                <GithubPosts />
                            </section>

                            {/* SoundCloud Player - Spans 2 columns on desktop */}
                            <section className="modern-card glass-card service-card service-card--soundcloud p-8 md:col-span-2 opacity-0 animate-slideInUp animation-delay-500">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center">
                                        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/20 rounded-2xl mr-4">
                                            <MusicalNoteIcon className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                SoundCloud Tracks
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">音楽とポッドキャスト</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/soundcloud"
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                    >
                                        すべて聴く →
                                    </Link>
                                </div>
                                <SoundCloudPlayer />
                            </section>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 opacity-0 animate-slideInUp animation-delay-500">
                            {[
                                { label: "ブログ記事", value: "50+", color: "text-red-600" },
                                { label: "技術記事", value: "30+", color: "text-emerald-600" },
                                { label: "リポジトリ", value: "20+", color: "text-indigo-600" },
                                { label: "音楽トラック", value: "10+", color: "text-cyan-600" },
                            ].map((stat, index) => (
                                <div 
                                    key={index} 
                                    className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:scale-105 transition-transform duration-300"
                                >
                                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </main>

                    <aside className="w-full lg:w-1/4 px-4 mt-8 lg:mt-0 opacity-0 animate-slideInRight animation-delay-300">
                        <div className="sticky top-8">
                            <Sidebar />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}