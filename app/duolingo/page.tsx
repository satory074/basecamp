import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import ExternalProfileLink from "../components/shared/ExternalProfileLink";
import DuolingoClient from "./DuolingoClient";

export const metadata: Metadata = {
    title: "Duolingo - Basecamp",
    description: "語学学習の進捗",
    openGraph: {
        title: "Duolingo - Basecamp",
        description: "語学学習の進捗",
    },
};

export default function DuolingoPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="duolingo" />

            <div className="main-content">
                <div className="content-wrapper">
                    <div className="mb-8">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Duolingo</h1>
                            <ExternalProfileLink platform="duolingo" platformLabel="Duolingo" />
                        </div>
                        <p className="text-gray-500 text-sm mt-1">語学学習の進捗</p>
                    </div>

                    <DuolingoClient />

                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
