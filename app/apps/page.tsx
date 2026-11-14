import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import AppsClient from "./AppsClient";
import type { AppsFile } from "../lib/types";
import { readFeedJson } from "../lib/feed-storage";

export const metadata: Metadata = pageMetadata("apps", "satory074 が作ったアプリ一覧");

async function loadApps(): Promise<AppsFile> {
    try {
        return await readFeedJson<AppsFile>("apps.json");
    } catch {
        return { lastUpdated: "", apps: [] };
    }
}

export default async function AppsPage() {
    const data = await loadApps();

    return (
        <div className="page page--wide">
            <PageHeader platform="apps" description={`自作アプリの一覧（${data.apps.length} 件）`} />

            <AppsClient apps={data.apps} />
        </div>
    );
}
