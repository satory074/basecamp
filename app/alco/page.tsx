import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import AlcoClient from "./AlcoClient";
import { getAlcoDays, summarizeAlcoDays } from "../lib/feeds/alco";

export const metadata: Metadata = { ...pageMetadata("alco", "1杯ごとの飲酒記録"), robots: { index: false, follow: false } };

export default async function AlcoPage() {
    const summary = summarizeAlcoDays(await getAlcoDays());

    return (
        <div className="page">
                    <PageHeader platform="alco" description="alco-diary で記録した1杯ごとのログ（時刻・金額は含まれません）" />

                    <AlcoClient summary={summary} />
                </div>
    );
}
