import type { NpbLeagueStandings, NpbRecord, NpbTeamStanding } from "../../lib/feeds/npb";
import { getTeam, teamColorVar, teamsOf } from "../../lib/npb-teams";

/** CS 進出圏。3 位までの下に境界線を引く */
const CLIMAX_SERIES_SPOTS = 3;

function formatRecord(record: NpbRecord | null | undefined): string {
    if (!record) return "";
    return record.draws > 0
        ? `${record.wins}-${record.losses}-${record.draws}`
        : `${record.wins}-${record.losses}`;
}

/** スクリーンリーダー用に「27勝25敗1分」と読み下す。"27-25-1" では意味が伝わらない */
function describeRecord(record: NpbRecord | null | undefined): string {
    if (!record) return "対戦なし";
    const draws = record.draws > 0 ? `${record.draws}分` : "";
    return `${record.wins}勝${record.losses}敗${draws}`;
}

interface StandingsTableProps {
    standings: NpbLeagueStandings;
    /** 交流戦表は「差」列も CS 境界も持たない */
    variant?: "regular" | "interleague";
    asOf: string | null;
    captionSuffix?: string;
}

export default function StandingsTable({
    standings,
    variant = "regular",
    asOf,
    captionSuffix,
}: StandingsTableProps) {
    const rows: NpbTeamStanding[] = variant === "interleague" ? standings.interleague : standings.teams;
    if (rows.length === 0) return null;

    const isRegular = variant === "regular";
    const opponents = teamsOf(standings.league);
    const asOfLabel = asOf ? `${Number(asOf.slice(5, 7))}月${Number(asOf.slice(8, 10))}日現在` : "";
    const caption = [standings.label, captionSuffix ?? "順位表", asOfLabel].filter(Boolean).join(" ");
    const tableId = `standings-${standings.league}-${variant}`;

    return (
        <section className="mb-8">
            {/* .content-wrapper は overflow-x: hidden なので、必ずこのスクロール領域に入れる。
                tabIndex がないとキーボードのみのユーザーが右側の列に到達できない。 */}
            <div
                className="data-table-scroll"
                role="region"
                aria-labelledby={`${tableId}-caption`}
                tabIndex={0}
            >
                <table className="data-table" id={tableId}>
                    <caption id={`${tableId}-caption`}>{caption}</caption>
                    <thead>
                        <tr>
                            <th scope="col" className="col-rank">
                                順位
                            </th>
                            <th scope="col" className="col-team">
                                チーム
                            </th>
                            <th scope="col">試合</th>
                            <th scope="col">勝</th>
                            <th scope="col">敗</th>
                            <th scope="col">分</th>
                            <th scope="col">勝率</th>
                            {isRegular && (
                                <th scope="col">
                                    差<span className="sr-only">（首位とのゲーム差）</span>
                                </th>
                            )}
                            <th scope="col">ホーム</th>
                            <th scope="col">ロード</th>
                            {opponents.map((opponent) => (
                                <th scope="col" key={opponent.id} id={`${tableId}-vs-${opponent.id}`}>
                                    <span aria-hidden="true">対{opponent.vsLabel}</span>
                                    <span className="sr-only">{opponent.shortName}戦</span>
                                </th>
                            ))}
                            {isRegular && <th scope="col">交流戦</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const team = getTeam(row.teamId);
                            const cutoff = isRegular && row.rank === CLIMAX_SERIES_SPOTS;
                            return (
                                <tr key={row.teamId} className={cutoff ? "is-cutoff" : undefined}>
                                    <td className="col-rank">
                                        {row.rank}
                                        {row.tied && <span className="sr-only">（同率）</span>}
                                        <span className="sr-only">位</span>
                                    </td>
                                    <th scope="row" className="col-team" id={`${tableId}-row-${row.teamId}`}>
                                        <span
                                            className="standings-team"
                                            style={{ ["--team-color" as string]: teamColorVar(row.teamId) }}
                                        >
                                            {team.shortName}
                                        </span>
                                    </th>
                                    <td>{row.games}</td>
                                    <td>{row.wins}</td>
                                    <td>{row.losses}</td>
                                    <td>{row.draws}</td>
                                    <td>{row.winPct}</td>
                                    {isRegular && (
                                        <td>
                                            {row.gamesBehind ?? (
                                                <>
                                                    <span aria-hidden="true">--</span>
                                                    <span className="sr-only">首位</span>
                                                </>
                                            )}
                                        </td>
                                    )}
                                    <td>{formatRecord(row.home)}</td>
                                    <td>{formatRecord(row.road)}</td>
                                    {opponents.map((opponent) => {
                                        const record = row.vs[opponent.id];
                                        const own = opponent.id === row.teamId;
                                        return (
                                            <td
                                                key={opponent.id}
                                                headers={`${tableId}-vs-${opponent.id} ${tableId}-row-${row.teamId}`}
                                                className={record ? undefined : "cell-empty"}
                                            >
                                                {own || !record ? (
                                                    <>
                                                        <span aria-hidden="true">—</span>
                                                        <span className="sr-only">自チーム</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span aria-hidden="true">{formatRecord(record)}</span>
                                                        <span className="sr-only">{describeRecord(record)}</span>
                                                    </>
                                                )}
                                            </td>
                                        );
                                    })}
                                    {isRegular && (
                                        <td className={row.interleagueRecord ? undefined : "cell-empty"}>
                                            {row.interleagueRecord ? (
                                                <>
                                                    <span aria-hidden="true">
                                                        {formatRecord(row.interleagueRecord)}
                                                    </span>
                                                    <span className="sr-only">
                                                        {describeRecord(row.interleagueRecord)}
                                                    </span>
                                                </>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {isRegular && (
                <p className="data-table-note">
                    横にスクロールすると対戦成績が見られます。3 位の下の太線はクライマックスシリーズ進出圏の境界です。
                </p>
            )}
        </section>
    );
}
