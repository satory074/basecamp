import type { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";

import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import GameDayList from "../components/npb/GameDayList";
import MonthNav from "../components/npb/MonthNav";
import StandingsTable from "../components/npb/StandingsTable";
import { flattenGames, getNpbGames, getNpbStandings, monthKeys, recentGames } from "../lib/feeds/npb";
import { getTeam } from "../lib/npb-teams";
import { formatJstDateTime } from "../lib/shared/date-utils";

export const metadata: Metadata = pageMetadata("baseball", "NPB セ・パ両リーグの順位表と全試合結果");

/** トップに出す直近の試合日数 */
const RECENT_DAYS = 3;

export default async function BaseballPage() {
    const [standings, games] = await Promise.all([getNpbStandings(), getNpbGames()]);

    if (!standings) {
        return (
            <div className="page page--wide">
                <PageHeader platform="baseball" />
                <p className="status-box">順位表のデータはまだありません。シーズン中は 1 日 2 回更新します。</p>
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
        <div className="page page--wide">
                    <PageHeader platform="baseball" description={`${standings.season}年シーズン セ・パ順位表と全試合結果`}>
                        <a href="https://npb.jp/" target="_blank" rel="noopener noreferrer">
                            日本野球機構（NPB）公式サイト
                            <span className="visually-hidden">（新しいタブで開く）</span>
                        </a>
                    </PageHeader>

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
                        取得: <time dateTime={standings.lastUpdated}>{formatJstDateTime(standings.lastUpdated)}</time>
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
                </div>
    );
}
