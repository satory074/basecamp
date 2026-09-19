import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import ExternalProfileLink from "../components/shared/ExternalProfileLink";
import { getPlaystationView } from "../lib/feeds/playstation";
import { jstDateTime } from "./format";
import GameShelf from "./GameShelf";
import LibraryGrid from "./LibraryGrid";
import PlayCalendar from "./PlayCalendar";
import PlaystationClient from "./PlaystationClient";
import PlaytimeRanking from "./PlaytimeRanking";
import ProfileHero from "./ProfileHero";
import RareTrophies from "./RareTrophies";
import RecentGames from "./RecentGames";

const DESCRIPTION = "PlayStation のトロフィー・プレイ時間・ライブラリ";

export const metadata: Metadata = {
    title: "PlayStation - Basecamp",
    description: DESCRIPTION,
    openGraph: {
        title: "PlayStation - Basecamp",
        description: DESCRIPTION,
    },
};

export default async function PlaystationPage() {
    const view = await getPlaystationView();

    return (
        <div className="split-layout">
            <Sidebar activePlatform="playstation" />

            <div className="main-content">
                <div className="content-wrapper">
                    <div className="mb-8">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">PlayStation</h1>
                            <ExternalProfileLink platform="playstation" platformLabel="PlayStation" />
                        </div>
                        <p className="text-gray-500 text-sm mt-1">トロフィー・プレイ時間・ライブラリ</p>
                    </div>

                    {view.lastUpdated && (
                        <p className="npb-freshness">
                            取得: <time dateTime={view.lastUpdated}>{jstDateTime(view.lastUpdated)}</time>
                            （PSN から 3 時間ごとに取得、ページは 1 日 2 回更新）
                        </p>
                    )}

                    <ProfileHero view={view} />

                    {view.recent.length > 0 && (
                        <>
                            <h2 className="section-title mt-8">最近遊んだゲーム</h2>
                            <RecentGames games={view.recent} />
                        </>
                    )}

                    <h2 className="section-title mt-8">プレイ記録</h2>
                    <PlayCalendar calendar={view.calendar} />

                    {view.ranking.length > 0 && (
                        <>
                            <h2 className="section-title mt-8">プレイ時間ランキング</h2>
                            <PlaytimeRanking games={view.ranking} />
                        </>
                    )}

                    {view.games.length > 0 && (
                        <>
                            <h2 className="section-title mt-8">ゲーム</h2>
                            <GameShelf games={view.games} otherSets={view.otherTrophySets} />
                        </>
                    )}

                    {view.rare.length > 0 && (
                        <>
                            <h2 className="section-title mt-8">レアトロフィー</h2>
                            <RareTrophies trophies={view.rare} />
                        </>
                    )}

                    {view.library.length > 0 && (
                        <>
                            <h2 id="library" className="section-title mt-8">
                                ライブラリ
                            </h2>
                            <LibraryGrid items={view.library} />
                        </>
                    )}

                    <h2 className="section-title mt-8">アクティビティ</h2>
                    <PlaystationClient />

                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
