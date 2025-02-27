"use client";

import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { config } from "../lib/config";

export default function SoundCloudPage() {
    const username = config.profiles.soundcloud.username;

    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-wrap -mx-4">
                <main className="w-full lg:w-3/4 px-4">
                    <div className="mb-6">
                        <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                            <span>←</span> Back to Home
                        </Link>
                    </div>

                    <h1 className="text-3xl font-bold mb-6">SoundCloud Tracks</h1>

                    <div className="my-8">
                        <iframe
                            title="SoundCloud Player"
                            width="100%"
                            height="600" // 大きめのプレイヤー
                            scrolling="no"
                            frameBorder="no"
                            allow="autoplay"
                            src={`https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/${username}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
                        />
                    </div>
                </main>

                <aside className="w-full lg:w-1/4 px-4">
                    <Sidebar />
                </aside>
            </div>
        </div>
    );
}
