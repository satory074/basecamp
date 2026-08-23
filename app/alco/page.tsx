import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import AlcoClient from "./AlcoClient";
import { getAlcoDays, summarizeAlcoDays } from "../lib/feeds/alco";

export const metadata: Metadata = {
    title: "飲酒記録 - Basecamp",
    description: "1杯ごとの飲酒記録",
    // 健康に関する記録なので、専用ページ単体が検索結果に出ないようにする
    robots: { index: false, follow: false },
    openGraph: {
        title: "飲酒記録 - Basecamp",
        description: "1杯ごとの飲酒記録",
    },
};

export default async function AlcoPage() {
    const summary = summarizeAlcoDays(await getAlcoDays());

    return (
        <div className="split-layout">
            <Sidebar activePlatform="alco" />

            <div className="main-content">
                <div className="content-wrapper">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">飲酒記録</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            alco-diary で記録した1杯ごとのログ（時刻・金額は含まれません）
                        </p>
                    </div>

                    <AlcoClient summary={summary} />

                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
