import { dayLabel, type NpbGame } from "../../lib/feeds/npb";
import { getTeam, teamColorVar } from "../../lib/npb-teams";

function groupByDate(games: NpbGame[]): [string, NpbGame[]][] {
    const groups = new Map<string, NpbGame[]>();
    for (const game of games) {
        const bucket = groups.get(game.date);
        if (bucket) bucket.push(game);
        else groups.set(game.date, [game]);
    }
    return [...groups.entries()];
}

/**
 * スコアを「7 - 8」とだけ読み上げさせないための完全な文。
 * 3 つの div を並べただけだと SR は「7 ハイフン 8」としか言わず、
 * どちらが何点でどちらが勝ったのか分からない。
 */
function describeGame(game: NpbGame): string {
    const home = getTeam(game.home).shortName;
    const away = getTeam(game.away).shortName;
    const when = `${Number(game.date.slice(5, 7))}月${Number(game.date.slice(8, 10))}日`;

    if (game.status === "final") {
        const outcome =
            game.homeScore === game.awayScore
                ? "引き分け"
                : `${game.homeScore > game.awayScore ? home : away}の勝ち`;
        return `${when} ${home} ${game.homeScore}、${away} ${game.awayScore}、${outcome}`;
    }
    if (game.status === "cancelled") {
        return `${when} ${home} 対 ${away} ${game.note}`;
    }
    return `${when} ${home} 対 ${away} ${game.startTime}開始予定`;
}

/** 左ボーダーの色。勝者の球団色、引分・中止・未実施はニュートラル */
function accentColor(game: NpbGame): string | undefined {
    if (game.status !== "final" || game.homeScore === game.awayScore) return undefined;
    return teamColorVar(game.homeScore > game.awayScore ? game.home : game.away);
}

function GameRow({ game }: { game: NpbGame }) {
    const home = getTeam(game.home);
    const away = getTeam(game.away);
    const accent = accentColor(game);
    const description = describeGame(game);

    const scoreboard =
        game.status === "final" ? (
            <div className="npb-game-teams">
                <span>{home.shortName}</span>
                <span
                    className={`npb-game-score${game.homeScore > game.awayScore ? " is-win" : ""}`}
                    aria-hidden="true"
                >
                    {game.homeScore}
                </span>
                <span className="npb-game-dash" aria-hidden="true">
                    -
                </span>
                <span
                    className={`npb-game-score${game.awayScore > game.homeScore ? " is-win" : ""}`}
                    aria-hidden="true"
                >
                    {game.awayScore}
                </span>
                <span>{away.shortName}</span>
            </div>
        ) : (
            <div className="npb-game-teams">
                <span>{home.shortName}</span>
                <span className="npb-game-status" aria-hidden="true">
                    {game.status === "cancelled" ? game.note : game.startTime}
                </span>
                <span>{away.shortName}</span>
            </div>
        );

    const meta =
        game.status === "final"
            ? [
                  game.place,
                  game.pitchers.win ? `勝 ${game.pitchers.win}` : null,
                  game.pitchers.lose ? `敗 ${game.pitchers.lose}` : null,
                  game.pitchers.save ? `S ${game.pitchers.save}` : null,
              ]
            : game.status === "scheduled"
              ? [game.place, ...game.probablePitchers]
              : [game.place];

    return (
        <li
            className="npb-game"
            style={accent ? ({ ["--team-color" as string]: accent } as React.CSSProperties) : undefined}
        >
            {game.status === "final" && game.boxScoreUrl ? (
                <a
                    href={game.boxScoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="npb-game-link"
                    aria-label={`${description}。ボックススコアを新しいタブで開く`}
                >
                    {scoreboard}
                </a>
            ) : (
                <div aria-label={description} role="group">
                    {scoreboard}
                </div>
            )}
            <p className="npb-game-meta">{meta.filter(Boolean).join(" ・ ")}</p>
        </li>
    );
}

export default function GameDayList({ games }: { games: NpbGame[] }) {
    if (games.length === 0) {
        return <p className="text-sm text-secondary">この期間の試合はありません。</p>;
    }

    return (
        <>
            {groupByDate(games).map(([date, dayGames]) => (
                <section className="npb-day-group" id={`day-${date}`} key={date}>
                    <h3 className="npb-day">{dayLabel(date, dayGames[0].weekday)}</h3>
                    <ol className="npb-games">
                        {dayGames.map((game) => (
                            <GameRow game={game} key={game.id} />
                        ))}
                    </ol>
                </section>
            ))}
        </>
    );
}
