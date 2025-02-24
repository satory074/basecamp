"use client";

import Profile from "./components/Profile";
import GithubWidget from "./components/GithubWidget";
import ZennPosts from "./components/ZennPosts";
import HatenaPosts from "./components/HatenaPosts";
import SoundCloudPlayer from "./components/SoundCloudPlayer";

export default function Home() {
    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-wrap -mx-4">
                <main className="w-full lg:w-3/4 px-4">
                    <h1 className="text-4xl font-bold mb-6">Welcome to Basecamp</h1>
                    <h2 className="text-2xl font-bold mb-4">Zenn Posts</h2>
                    <ZennPosts />
                    <h2 className="text-2xl font-bold mb-4">Hatena Posts</h2>
                    <HatenaPosts />
                    <h2 className="text-2xl font-bold mb-4">SoundCloud Player</h2>
                    <SoundCloudPlayer />
                </main>

                <aside className="w-full lg:w-1/4 px-4">
                    <Profile />
                    <GithubWidget />
                </aside>
            </div>
        </div>
    );
}
