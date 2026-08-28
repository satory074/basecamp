import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Sidebar from "../../components/Sidebar";
import GameDayList from "../../components/npb/GameDayList";
import MonthNav from "../../components/npb/MonthNav";
import { getNpbGames, monthKeys } from "../../lib/feeds/npb";

interface PageProps {
    params: Promise<{ month: string }>;
}

/**
 * 静的エクスポートなので全月を事前生成する。
 * 860 試合を 1 ページに置くと HTML が ~400KB になるため月で割っている。
 */
export async function generateStaticParams() {
    const games = await getNpbGames();
    return monthKeys(games).map((month) => ({ month }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { month } = await params;
    const title = `プロ野球 ${Number(month)}月の試合結果 - Basecamp`;
    return { title, description: `NPB ${Number(month)}月の全試合結果`, openGraph: { title } };
}

export default async function BaseballMonthPage({ params }: PageProps) {
    const { month } = await params;
    const games = await getNpbGames();
    const monthGames = games?.months[month];

    if (!monthGames) notFound();

    // 月内は日付昇順で読む方が自然（トップの「直近」は降順）
    const sorted = [...monthGames].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    return (
        <div className="split-layout">
            <Sidebar activePlatform="baseball" />

            <div className="main-content">
                <div className="content-wrapper">
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold tracking-tight">
                            プロ野球 {Number(month)}月の試合結果
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {games?.season}年シーズン ・ 全 {sorted.length} 試合
                        </p>
                    </div>

                    <MonthNav months={monthKeys(games)} current={month} />

                    <GameDayList games={sorted} />

                    <p className="mt-6">
                        <Link href="/baseball" className="platform-tag">
                            順位表へ戻る
                        </Link>
                    </p>

                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
