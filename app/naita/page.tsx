import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import NaitaClient from "./NaitaClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "泣いた記録 - Basecamp",
    description: "感動して泣いたコンテンツの記録",
    openGraph: {
        title: "泣いた記録 - Basecamp",
        description: "感動して泣いたコンテンツの記録",
    },
};

export default function NaitaPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="naita" />

            <div className="main-content">
                <div className="content-wrapper">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">泣いた記録</h1>
                        <p className="text-gray-500 text-sm mt-1">感動して泣いたコンテンツの記録</p>
                    </div>

                    <NaitaClient />

                    <div className="footer hide-desktop">
                        <p>© {new Date().getFullYear()} satory074</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
