import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import FF14AchievementsClient from "./FF14AchievementsClient";

export const metadata: Metadata = pageMetadata("ff14-achievement", "FF14 取得済みアチーブメント一覧");

export default function FF14AchievementsPage() {
    return (
        <div className="page">
                    <PageHeader platform="ff14-achievement" description="取得済みアチーブメント一覧" />

                    {/* Achievements Feed */}
                    <FF14AchievementsClient />
                </div>
    );
}
