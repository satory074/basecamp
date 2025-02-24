// app/components/Header.tsx
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
    return (
        <header className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold text-[#1c1c1c] dark:text-white">
                            <span className="sr-only">ホームページへ戻る</span>
                            Basecamp
                        </Link>
                    </div>

                    <nav className="flex items-center space-x-4">
                        <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                            <span className="sr-only">メニューを開く</span>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                            <span className="hidden sm:inline">メニュー</span>
                        </button>

                        <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                            <span className="sr-only">検索を開く</span>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <span className="hidden sm:inline">検索</span>
                        </button>

                        <ThemeToggle />
                    </nav>
                </div>
            </div>
        </header>
    );
}
