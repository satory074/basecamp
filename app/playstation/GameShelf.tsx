import Image from "next/image";
import type { PsGameView, PsTrophySetView } from "../lib/feeds/playstation";
import { gameAnchor, psImage, totalTrophies } from "../lib/playstation-types";
import { formatDuration } from "../lib/shared/duration";
import { jstDate } from "./format";
import TrophyCountRow from "./TrophyCountRow";

function TrophySetBlock({ set, showName }: { set: PsTrophySetView; showName: boolean }) {
    const completedDlcs = set.dlcs.filter((g) => g.progress === 100).length;
    return (
        <div className="ps-set">
            <div className="ps-set-head">
                <span className="ps-set-label">
                    トロフィー {set.platform.replace(/,/g, " / ")}
                    {showName && <span className="ps-set-name">{set.name}</span>}
                </span>
                <span className="ps-set-progress">{set.progress}%</span>
            </div>
            <div
                className="ps-bar ps-bar-sm"
                role="progressbar"
                aria-label={`${set.name}（${set.platform}）のトロフィー進捗`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={set.progress}
            >
                <span style={{ width: `${set.progress}%` }} />
            </div>
            <div className="ps-set-foot">
                <TrophyCountRow earned={set.earned} defined={set.defined} size="sm" />
                {set.lastEarnedAt && <span className="ps-set-last">最終獲得 {jstDate(set.lastEarnedAt)}</span>}
            </div>
            {set.dlcs.length > 0 && (
                <details className="ps-dlc">
                    <summary>
                        DLC {set.dlcs.length}
                        {completedDlcs > 0 && `（${completedDlcs} 件コンプリート）`}
                    </summary>
                    <ul className="ps-dlc-list">
                        {set.dlcs.map((g) => (
                            <li key={g.id} className="ps-dlc-item">
                                <span className="ps-dlc-name">{g.name}</span>
                                <span className="ps-dlc-count">
                                    {totalTrophies(g.earned)}/{totalTrophies(g.defined)}
                                </span>
                                <span className="ps-bar ps-bar-xs" aria-hidden="true">
                                    <span style={{ width: `${g.progress}%` }} />
                                </span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}

function GameCard({ game }: { game: PsGameView }) {
    const icon = psImage(game.icon, 160);
    const multiSet = game.trophySets.length > 1;
    return (
        <article id={gameAnchor(game.conceptId)} className="ps-game">
            <div className="ps-game-icon">{icon && <Image src={icon} alt="" width={72} height={72} />}</div>
            <div className="ps-game-body">
                <h3 className="ps-game-name">
                    {game.name}
                    {game.platforms.map((p) => (
                        <span key={p} className="ps-chip">
                            {p}
                        </span>
                    ))}
                </h3>
                <p className="ps-game-meta">
                    累計 <strong>{formatDuration(game.seconds)}</strong> · 起動 {game.playCount.toLocaleString("en-US")}回
                    <br />
                    {jstDate(game.firstPlayed)} 〜 {jstDate(game.lastPlayed)}
                </p>
                {game.trophySets.map((s) => (
                    <TrophySetBlock key={s.npCommunicationId} set={s} showName={multiSet && s.name !== game.name} />
                ))}
            </div>
        </article>
    );
}

/** プレイした全ゲーム (最後に遊んだ順)。ホームフィードのカードはここの #game-<conceptId> にリンクする */
export default function GameShelf({ games, otherSets }: { games: PsGameView[]; otherSets: PsTrophySetView[] }) {
    return (
        <div className="ps-games">
            {games.map((g) => (
                <GameCard key={g.conceptId} game={g} />
            ))}
            {otherSets.map((s) => (
                <article key={s.npCommunicationId} className="ps-game">
                    <div className="ps-game-icon">
                        {s.icon && <Image src={s.icon} alt="" width={72} height={72} />}
                    </div>
                    <div className="ps-game-body">
                        <h3 className="ps-game-name">{s.name}</h3>
                        <TrophySetBlock set={s} showName={false} />
                    </div>
                </article>
            ))}
        </div>
    );
}
