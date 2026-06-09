import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import ExternalProfileLink from "../components/shared/ExternalProfileLink";
import PlaystationClient from "./PlaystationClient";

export const metadata: Metadata = {
    title: "PlayStation - Basecamp",
    description: "PlayStationトロフィー",
    openGraph: {
        title: "PlayStation - Basecamp",
        description: "PlayStationトロフィー",
    },
};

export default function PlaystationPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="playstation" />

            <div className="main-content">
                <div className="content-wrapper">
                    <div className="mb-8">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">PlayStation</h1>
                            <ExternalProfileLink platform="playstation" platformLabel="PlayStation" />
                        </div>
                        <p className="text-gray-500 text-sm mt-1">トロフィー</p>
                    </div>

                    <PlaystationClient />

                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
