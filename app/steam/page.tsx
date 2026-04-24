import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import ExternalProfileLink from "../components/shared/ExternalProfileLink";
import SteamClient from "./SteamClient";

export const metadata: Metadata = {
    title: "Steam - Basecamp",
    description: "Steamゲーム実績",
    openGraph: {
        title: "Steam - Basecamp",
        description: "Steamゲーム実績",
    },
};

export default function SteamPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="steam" />

            <div className="main-content">
                <div className="content-wrapper">
                    <div className="mb-8">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Steam</h1>
                            <ExternalProfileLink platform="steam" platformLabel="Steam" />
                        </div>
                        <p className="text-gray-500 text-sm mt-1">ゲーム実績</p>
                    </div>

                    <SteamClient />

                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
