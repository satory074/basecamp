import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import DiaryClient from "./DiaryClient";

export const metadata: Metadata = pageMetadata("diary", "各サービスの活動を 1 日 1 枚にまとめたデイリーログ");

export default function DiaryPage() {
    return (
        <div className="page">
                    <PageHeader platform="diary" description="各サービスの活動を 1 日 1 枚にまとめたデイリーログ (見出しと導入文のみ AI が要約)" />

                    {/* Posts */}
                    <DiaryClient />
                </div>
    );
}
