// app/page.tsx
"use client";

import HatenaPosts from "./components/HatenaPosts";
import ZennPosts from "./components/ZennPosts";

export default function Home() {
    return (
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-12 gap-4">
                <main className="col-span-12 md:col-span-8 lg:col-span-9">
                    <h1 className="text-4xl font-bold mb-6">Welcome to Basecamp</h1>
                    <div className="grid grid-cols-12 gap-4">
                        <section className="col-span-12" aria-labelledby="latest-posts">
                            <h2 id="latest-posts" className="text-2xl font-bold mb-4">
                                最新の投稿
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <HatenaPosts />
                                <ZennPosts />
                            </div>
                        </section>
                    </div>
                </main>

                <aside className="col-span-12 md:col-span-4 lg:col-span-3">
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-none border border-gray-200">
                        <h2 className="text-xl font-bold mb-4">プロフィール</h2>
                        <p className="text-[#1c1c1c] dark:text-gray-300">
                            Web開発とアクセシビリティに関心のあるエンジニアです。
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
