import type { Metadata } from "next";

import Sidebar from "../components/Sidebar";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import GameDayList from "../components/npb/GameDayList";
import MonthNav from "../components/npb/MonthNav";
import StandingsTable from "../components/npb/StandingsTable";
import { flattenGames, getNpbGames, getNpbStandings, monthKeys, recentGames } from "../lib/feeds/npb";
import { getTeam } from "../lib/npb-teams";
import { formatRelativeTime } from "../lib/shared/date-utils";

export const metadata: Metadata = {
    title: "プロ野球 - Basecamp",
    description: "NPB セ・パ両リーグの順位表と全試合結果",
    openGraph: {
        title: "プロ野球 - Basecamp",
        description: "NPB セ・パ両リーグの順位表と全試合結果",
    },
};

/** トップに出す直近の試合日数 */
const RECENT_DAYS = 3;

export default async function BaseballPage() {
    const [standings, games] = await Promise.all([getNpbStandings(), getNpbGames()]);

    if (!standings) {
        return (
            <div className="split-layout">
                <Sidebar activePlatform="baseball" />
                <div className="main-content">
                    <div className="content-wrapper">
                        <h1 className="text-2xl font-bold tracking-tight">プロ野球</h1>
                        <p className="text-secondary mt-4">順位表データをまだ取得できていません。</p>
                    </div>
                </div>
            </div>
        );
    }

    const allGames = flattenGames(games);
    const finalCount = allGames.filter((g) => g.status === "final").length;
    const scheduledCount = allGames.filter((g) => g.status === "scheduled").length;

    const leaderStat = (league: "central" | "pacific") => {
        const top = standings.leagues.find((l) => l.league === league)?.teams[0];
        return top ? getTeam(top.teamId).shortName : "-";
    };

    return (
        <div className="split-layout">
            <Sidebar activePlatform="baseball" />

            <div className="main-content">
                <div className="content-wrapper">
                    <div className="mb-6">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">プロ野球</h1>
                            <a
                                href="https://npb.jp/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="platform-tag"
                                aria-label="日本野球機構（NPB）公式サイトを新しいタブで開く"
                            >
                                NPB 公式
                            </a>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                            {standings.season}年シーズン セ・パ順位表と全試合結果
                        </p>
                    </div>

                    {/* データそのものの日付と取得時刻の両方を出す。前者が真の鮮度 */}
                    <p className="npb-freshness">
                        {standings.asOf && (
                            <>
                                データ:{" "}
                                <time dateTime={standings.asOf}>
                                    {standings.asOf.replace(/-/g, "/")}
                                </time>{" "}
                                現在
                                <br />
                            </>
                        )}
                        取得: <time dateTime={standings.lastUpdated}>{formatRelativeTime(standings.lastUpdated)}</time>
                        （1 日 2 回更新。試合速報ではありません）
                    </p>

                    <PlatformDashboard
                        platform="baseball"
                        stats={[
                            { label: "セ首位", value: leaderStat("central") },
                            { label: "パ首位", value: leaderStat("pacific") },
                            { label: "消化試合", value: finalCount },
                            { label: "残り試合", value: scheduledCount },
                        ]}
                    />

                    <h2 className="section-title mt-8">順位表</h2>
                    {standings.leagues.map((league) => (
                        <StandingsTable key={league.league} standings={league} asOf={standings.asOf} />
                    ))}

                    <h2 className="section-title mt-8">交流戦</h2>
                    {standings.leagues.map((league) => (
                        <StandingsTable
                            key={`il-${league.league}`}
                            standings={league}
                            variant="interleague"
                            asOf={standings.asOf}
                            captionSuffix="交流戦成績"
                        />
                    ))}

                    <h2 className="section-title mt-8">直近の試合結果</h2>
                    <GameDayList games={recentGames(games, RECENT_DAYS)} />

                    <h2 className="section-title mt-8">月別の全試合</h2>
                    <MonthNav months={monthKeys(games)} />

                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
