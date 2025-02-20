// app/page.tsx
"use client";

import ZennPosts from "./components/ZennPosts";

export default function Home() {
    return (
        <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* メインコンテンツエリア */}
            <section className="md:col-span-7">
                <h1 className="text-4xl font-bold mb-4">Welcome to Basecamp</h1>
                <p className="text-lg leading-relaxed mb-8">
                    ここは個人用ホームページです。デジタル庁のベストプラクティスに基づいたシンプルで洗練されたデザイン、アクセシビリティに配慮した構造を採用しています。
                </p>
                <ZennPosts />
            </section>

            {/* サイドバーエリア */}
            <aside className="md:col-span-5">
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold mb-2">最新のお知らせ</h2>
                    <ul className="space-y-2">
                        <li>
                            <a href="#" className="text-blue-600 hover:underline">
                                サイトリニューアルのお知らせ
                            </a>
                        </li>
                        <li>
                            <a href="#" className="text-blue-600 hover:underline">
                                新しいポートフォリオの公開
                            </a>
                        </li>
                        <li>
                            <a href="#" className="text-blue-600 hover:underline">
                                ブログ記事「デジタル庁のベストプラクティス」
                            </a>
                        </li>
                    </ul>
                </div>
            </aside>
        </main>
    );
}
