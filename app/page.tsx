// app/page.tsx
"use client";

import HatenaPosts from "./components/HatenaPosts";
import ZennPosts from "./components/ZennPosts";

export default function Home() {
    return (
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-8 py-8">
            <main className="md:col-span-8 lg:col-span-9">
                <h1 className="text-4xl font-bold mb-6">Welcome to Basecamp</h1>
                <p className="text-lg mb-8 leading-relaxed">
                    デジタル庁のベストプラクティスに基づいた、シンプルで使いやすい個人用ホームページです。
                    アクセシビリティと使いやすさを重視した設計を採用しています。
                </p>
                <section aria-labelledby="latest-posts">
                    <h2 id="latest-posts" className="text-2xl font-bold mb-4">
                        最新の投稿
                    </h2>
                    <HatenaPosts />
                    <ZennPosts />
                </section>
            </main>

            <aside className="md:col-span-4 lg:col-span-3">
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">プロフィール</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Web開発とアクセシビリティに関心のあるエンジニアです。
                    </p>
                </div>
            </aside>
        </div>
    );
}
