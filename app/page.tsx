// app/page.tsx
"use client";

import HatenaPosts from "./components/HatenaPosts";
import ZennPosts from "./components/ZennPosts";

export default function Home() {
    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-wrap -mx-4">
                <main className="w-full lg:w-3/4 px-4">
                    <h1 className="text-4xl font-bold mb-6">Welcome to Basecamp</h1>
                    <section aria-labelledby="latest-posts">
                        <h2 id="latest-posts" className="text-2xl font-bold mb-4">
                            最新の投稿
                        </h2>
                        <div className="flex flex-wrap -mx-2">
                            <div className="w-full md:w-1/2 lg:w-1/3 px-2 mb-4">
                                <HatenaPosts />
                            </div>
                            <div className="w-full md:w-1/2 lg:w-1/3 px-2 mb-4">
                                <ZennPosts />
                            </div>
                        </div>
                    </section>
                </main>

                <aside className="w-full lg:w-1/4 px-4">
                    <div className="bg-white dark:bg-gray-800 p-6 border border-gray-200">
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
