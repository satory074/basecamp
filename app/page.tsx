"use client";

import UnifiedFeed from "./components/UnifiedFeed";
import Profile from "./components/Profile";

export default function Home() {
    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-wrap -mx-4">
                <main className="w-full lg:w-3/4 px-4">
                    <h1 className="text-4xl font-bold mb-6">Welcome to Basecamp</h1>
                    <UnifiedFeed />
                </main>

                <Profile />
            </div>
        </div>
    );
}
