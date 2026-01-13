"use client";

import Sidebar from "../components/Sidebar";
import { config } from "../lib/config";

export default function SoundCloudPage() {
    const username = config.profiles.soundcloud.username;

    return (
        <div className="split-layout">
            <Sidebar activePlatform="soundcloud" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">SoundCloud</h1>
                        <p className="text-gray-500 text-sm mt-1">音楽とトラック</p>
                    </div>

                    {/* SoundCloud Player */}
                    <div className="border border-gray-200">
                        <iframe
                            title="SoundCloud Player"
                            width="100%"
                            height="500"
                            scrolling="no"
                            frameBorder="no"
                            allow="autoplay"
                            src={`https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/${username}&color=%23000000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`}
                        />
                    </div>

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
