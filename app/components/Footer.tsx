"use client";

import { HeartIcon } from "@heroicons/react/24/solid";

export default function Footer() {
    return (
        <footer className="relative mt-16">
            {/* Gradient Line */}
            <div className="h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
            
            <div className="bg-gray-50 dark:bg-gray-900/50 py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        {/* Logo & Description */}
                        <div className="flex flex-col items-center md:items-start space-y-2">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">B</span>
                                </div>
                                <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Basecamp
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
                                すべてのクリエイティブ活動を一つの場所で
                            </p>
                        </div>

                        {/* Links */}
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            <a 
                                href="/hatena" 
                                className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                            >
                                Hatena Blog
                            </a>
                            <a 
                                href="/zenn" 
                                className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                            >
                                Zenn Articles
                            </a>
                            <a 
                                href="/github" 
                                className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                            >
                                GitHub
                            </a>
                            <a 
                                href="/soundcloud" 
                                className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                            >
                                SoundCloud
                            </a>
                        </div>

                        {/* Copyright with heart */}
                        <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                            <span>© 2025 Made with</span>
                            <HeartIcon className="w-4 h-4 text-red-500 animate-pulse" />
                            <span>in Japan</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}