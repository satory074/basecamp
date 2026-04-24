import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import ExternalProfileLink from "../components/shared/ExternalProfileLink";
import NoteClient from "./NoteClient";

export const metadata: Metadata = {
    title: "Note - Basecamp",
    description: "クリエイターとしての発信",
    openGraph: {
        title: "Note - Basecamp",
        description: "クリエイターとしての発信",
    },
};

export default function NotePage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="note" />

            <div className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Note</h1>
                            <ExternalProfileLink platform="note" platformLabel="Note" />
                        </div>
                        <p className="text-gray-500 text-sm mt-1">クリエイターとしての発信</p>
                    </div>

                    {/* Posts */}
                    <NoteClient />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
