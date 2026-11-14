import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import TenhouClient from "./TenhouClient";

export const metadata: Metadata = pageMetadata("tenhou", "天鳳戦績・麻雀統計データ");

export default function TenhouPage() {
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
                    <TenhouClient />
                </div>
    );
}
