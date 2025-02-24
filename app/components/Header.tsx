// app/components/Header.tsx
import Link from "next/link";
import SearchIcon from "./icons/SearchIcon";

export default function Header() {
    return (
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* ロゴ部分 */}
                    <div className="flex-shrink-0">
                        <Link
                            href="/"
                            className="group flex items-center font-bold text-xl text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            Basecamp
                        </Link>
                    </div>

                    {/* 右側のアクション */}
                    <div className="flex items-center space-x-1">
                        {/* 検索ボタン */}
                        <button type="button" className="action-button" aria-label="検索を開く">
                            <SearchIcon className="w-5 h-5" />
                            <span className="hidden sm:block ml-2">検索</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
