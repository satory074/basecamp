"use client";

import dynamic from "next/dynamic";
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
                        <h2 className="text-2xl font-bold mb-4">Hatena Posts</h2>
                        <HatenaPosts />
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">Zenn Posts</h2>
                        <ZennPosts />
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">GitHub Activity</h2>
                        <GithubPosts />
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">SoundCloud Player</h2>
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
