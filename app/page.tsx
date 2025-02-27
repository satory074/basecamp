"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Sidebar from "./components/Sidebar";

// Dynamic imports for content sections
const HatenaPosts = dynamic(() => import("./components/HatenaPosts"));
const ZennPosts = dynamic(() => import("./components/ZennPosts"));
const GithubPosts = dynamic(() => import("./components/GithubPosts"));
const SoundCloudPlayer = dynamic(() => import("./components/SoundCloudPlayer"));

export default function Home() {
    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-wrap -mx-4">
                <main className="w-full lg:w-3/4 px-4">
                    <h1 className="text-4xl font-bold mb-6">Welcome to Basecamp</h1>

                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Hatena Posts</h2>
                            <Link href="/hatena" className="text-blue-600 hover:text-blue-800">
                                View all →
                            </Link>
                        </div>
                        <HatenaPosts />
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Zenn Posts</h2>
                            <Link href="/zenn" className="text-blue-600 hover:text-blue-800">
                                View all →
                            </Link>
                        </div>
                        <ZennPosts />
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">GitHub Activity</h2>
                            <Link href="/github" className="text-blue-600 hover:text-blue-800">
                                View all →
                            </Link>
                        </div>
                        <GithubPosts />
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">SoundCloud Player</h2>
                            <Link href="/soundcloud" className="text-blue-600 hover:text-blue-800">
                                View all →
                            </Link>
                        </div>
                        <SoundCloudPlayer />
                    </section>
                </main>

                <aside className="w-full lg:w-1/4 px-4">
                    <Sidebar />
                </aside>
            </div>
        </div>
    );
}
