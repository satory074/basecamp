// app/components/Header.tsx
import Link from "next/link";

export default function Header() {
    return (
        <header className="bg-gray-100 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <div className="flex items-center">
                    {/* ロゴ部分。画像やアイコンを利用する場合は、<img> タグに変更 */}
                    <Link href="/" className="text-xl font-bold text-gray-900" aria-label="ホーム">
                        Basecamp
                    </Link>
                </div>
                <nav className="flex space-x-4">
                    <Link href="/about" className="text-gray-700 hover:text-gray-900" aria-label="自己紹介">
                        自己紹介
                    </Link>
                    <Link href="/portfolio" className="text-gray-700 hover:text-gray-900" aria-label="ポートフォリオ">
                        ポートフォリオ
                    </Link>
                    <Link href="/contact" className="text-gray-700 hover:text-gray-900" aria-label="お問い合わせ">
                        お問い合わせ
                    </Link>
                </nav>
            </div>
        </header>
    );
}
