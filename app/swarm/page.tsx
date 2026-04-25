import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import ExternalProfileLink from "../components/shared/ExternalProfileLink";
import SwarmClient from "./SwarmClient";

export const metadata: Metadata = {
    title: "Swarm - Basecamp",
    description: "訪れた場所のチェックイン記録",
    openGraph: {
        title: "Swarm - Basecamp",
        description: "訪れた場所のチェックイン記録",
    },
};

export default function SwarmPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="swarm" />

            <div className="main-content">
                <div className="content-wrapper">
                    <div className="mb-8">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Swarm</h1>
                            <ExternalProfileLink platform="swarm" platformLabel="Swarm" />
                        </div>
                        <p className="text-gray-500 text-sm mt-1">訪れた場所のチェックイン記録</p>
                    </div>

                    <SwarmClient />

                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
