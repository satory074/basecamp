import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import AppsClient from "./AppsClient";
import type { AppsFile } from "../lib/types";
import { readFeedJson } from "../lib/feed-storage";
import JsonLd from "../components/site/JsonLd";
import { appsJsonLd } from "../lib/jsonld";
import { config } from "../lib/config";
import { pageTitle } from "../lib/seo";

const DESCRIPTION =
    "satory074 が作って公開している Web アプリの一覧。百人一首の暗記、点字の学習、M-1 の通過・敗退の記録、同じ誕生日の有名人、過去 30 年の天気から日取りを選ぶアプリなど。";

export const metadata: Metadata = pageMetadata("apps", DESCRIPTION);

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
            <JsonLd data={appsJsonLd(data.apps, `${config.siteUrl}/apps/`, pageTitle("作品"))} />
            <PageHeader platform="apps" description={`自作アプリの一覧（${data.apps.length} 件）`} />
            <p className="apps-intro">
                satory074 が作って公開しているアプリです。カードを押すとアプリが新しいタブで開きます。
            </p>

            <AppsClient apps={data.apps} />
        </div>
    );
}
