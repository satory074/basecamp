// app/components/Header.tsx
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
    return (
        <header className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <div className="flex items-center">
                    {/* ロゴ部分。画像やアイコンを利用する場合は、<img> タグに変更 */}
                    <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white" aria-label="ホーム">
                        Basecamp
                    </Link>
                </div>
                <div className="flex items-center space-x-4">
                    <nav className="flex space-x-4">
                        <Link
                            href="/about"
                            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            aria-label="自己紹介"
                        >
                            自己紹介
                        </Link>
                        <Link
                            href="/portfolio"
                            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            aria-label="ポートフォリオ"
                        >
                            ポートフォリオ
                        </Link>
                        <Link
                            href="/contact"
                            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            aria-label="お問い合わせ"
                        >
                            お問い合わせ
                        </Link>
                    </nav>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
