// app/page.tsx
"use client";

import UnifiedFeed from "./components/UnifiedFeed";

export default function Home() {
    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-wrap -mx-4">
                <main className="w-full lg:w-3/4 px-4">
                    <h1 className="text-4xl font-bold mb-6">Welcome to Basecamp</h1>
                    <UnifiedFeed />
                </main>

                <aside className="w-full lg:w-1/4 px-4">
                    <h2 className="text-xl font-bold mb-4">プロフィール</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Web開発とアクセシビリティに関心のあるエンジニアです。
                    </p>
                </aside>
            </div>
        </div>
    );
}
