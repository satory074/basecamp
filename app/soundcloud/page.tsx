import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import ExternalProfileLink from "../components/shared/ExternalProfileLink";
import SoundCloudClient from "./SoundCloudClient";

export const metadata: Metadata = {
    title: "SoundCloud - Basecamp",
    description: "音楽とトラック",
    openGraph: {
        title: "SoundCloud - Basecamp",
        description: "音楽とトラック",
    },
};

export default function SoundCloudPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="soundcloud" />

            <div className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">SoundCloud</h1>
                            <ExternalProfileLink platform="soundcloud" platformLabel="SoundCloud" />
                        </div>
                        <p className="text-gray-500 text-sm mt-1">音楽とトラック</p>
                    </div>

                    {/* SoundCloud Player */}
                    <SoundCloudClient />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
