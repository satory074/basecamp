import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import ExternalProfileLink from "../components/shared/ExternalProfileLink";
import XClient from "./XClient";

export const metadata: Metadata = {
    title: "X (Twitter) - Basecamp",
    description: "ポストといいね",
    openGraph: {
        title: "X (Twitter) - Basecamp",
        description: "ポストといいね",
    },
};

export default function XPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="x" />

            <div className="main-content">
                <div className="content-wrapper">
                    <div className="mb-8">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">X (Twitter)</h1>
                            <ExternalProfileLink platform="x" platformLabel="X" />
                        </div>
                        <p className="text-gray-500 text-sm mt-1">ポストといいね</p>
                    </div>

                    <XClient />

                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
