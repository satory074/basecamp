import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import TenhouStats from "../components/TenhouStats";
import { getTenhouStats } from "../lib/feeds/tenhou";

export const metadata: Metadata = pageMetadata("tenhou", "天鳳戦績・麻雀統計データ");

export default async function TenhouPage() {
    const data = (await getTenhouStats().catch(() => null));

    return (
        <div className="page">
            <PageHeader platform="tenhou" description="天鳳での対局成績" profile={false}>
                <a href="https://tenhou.net/" target="_blank" rel="noopener noreferrer">
                    天鳳で対戦する
                    <span className="visually-hidden">（新しいタブで開く）</span>
                </a>
                <a href="https://nodocchi.moe/tenhoulog/?name=Unbobo" target="_blank" rel="noopener noreferrer">
                    詳しい統計（nodocchi）
                    <span className="visually-hidden">（新しいタブで開く）</span>
                </a>
            </PageHeader>

            {/* Stats */}
            <TenhouStats stats={data} />
        </div>
    );
}
