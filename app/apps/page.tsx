import { Metadata } from "next";
import * as fs from "fs";
import * as path from "path";
import Sidebar from "../components/Sidebar";
import AppsClient from "./AppsClient";
import type { AppsFile } from "../lib/types";

export const metadata: Metadata = {
    title: "作品 - Basecamp",
    description: "satory074 が作った Web アプリ一覧",
    openGraph: {
        title: "作品 - Basecamp",
        description: "satory074 が作った Web アプリ一覧",
    },
};

function loadApps(): AppsFile {
    try {
        const filePath = path.join(process.cwd(), "public/data/apps.json");
        return JSON.parse(fs.readFileSync(filePath, "utf-8")) as AppsFile;
    } catch {
        return { lastUpdated: "", apps: [] };
    }
}

export default function AppsPage() {
    const data = loadApps();

    return (
        <div className="split-layout">
            <Sidebar activePlatform="apps" />

            <div className="main-content">
                <div className="content-wrapper">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">作品</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            自作 Web アプリの一覧（{data.apps.length} 件）
                        </p>
                    </div>

                    <AppsClient apps={data.apps} />

                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
