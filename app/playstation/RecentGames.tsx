import Image from "next/image";
import type { PsGameView } from "../lib/feeds/playstation";
import { gameAnchor, psImage } from "../lib/playstation-types";
import { formatDuration } from "../lib/shared/duration";
import { jstDate } from "./format";

/** 最近遊んだゲーム。キービジュアルの上に最終プレイ日と累計を重ねる */
export default function RecentGames({ games }: { games: PsGameView[] }) {
    if (games.length === 0) return null;
    return (
        <ul className="ps-recent">
            {games.map((g) => {
                const img = psImage(g.hero ?? g.icon, 720);
                return (
                    <li key={g.conceptId} className="ps-recent-item">
                        <a href={`#${gameAnchor(g.conceptId)}`} className="ps-recent-link">
                            <div className="ps-recent-art">
                                {img && <Image src={img} alt="" fill sizes="(max-width: 640px) 100vw, 340px" />}
                            </div>
                            <div className="ps-recent-body">
                                <span className="ps-recent-name">{g.name}</span>
                                <span className="ps-recent-meta">
                                    最終プレイ {jstDate(g.lastPlayed)} · 累計 {formatDuration(g.seconds)}
                                </span>
                            </div>
                        </a>
                    </li>
                );
            })}
        </ul>
    );
}
