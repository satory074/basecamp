import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import AppleHealthClient from "./AppleHealthClient";

export const metadata: Metadata = {
    title: "Apple Health - Basecamp",
    description: "iPhoneヘルスケアのワークアウト記録",
    openGraph: {
        title: "Apple Health - Basecamp",
        description: "iPhoneヘルスケアのワークアウト記録",
    },
};

export default function AppleHealthPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="applehealth" />

            <div className="main-content">
                <div className="content-wrapper">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Apple Health</h1>
                        <p className="text-gray-500 text-sm mt-1">ワークアウト記録</p>
                    </div>

                    <AppleHealthClient />

                    <div className="footer hide-desktop">
                        <p>© {new Date().getFullYear()} satory074</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
