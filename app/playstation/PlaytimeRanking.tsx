import Image from "next/image";
import type { PsGameView } from "../lib/feeds/playstation";
import { gameAnchor, psImage } from "../lib/playstation-types";
import { formatDuration } from "../lib/shared/duration";

/** 累計プレイ時間 Top10 (PS4 版と PS5 版は合算) */
export default function PlaytimeRanking({ games }: { games: PsGameView[] }) {
    if (games.length === 0) return null;
    const max = Math.max(...games.map((g) => g.seconds), 1);
    return (
        <ol className="ps-ranking">
            {games.map((g, i) => {
                const icon = psImage(g.icon, 96);
                return (
                    <li key={g.conceptId} className="ps-ranking-item">
                        <a href={`#${gameAnchor(g.conceptId)}`} className="ps-ranking-link">
                            <span className="ps-ranking-rank">{i + 1}</span>
                            <span className="ps-ranking-icon">
                                {icon && <Image src={icon} alt="" width={32} height={32} />}
                            </span>
                            <span className="ps-ranking-main">
                                <span className="ps-ranking-name">{g.name}</span>
                                <span className="ps-ranking-bar" aria-hidden="true">
                                    <span style={{ width: `${Math.max(1, (g.seconds / max) * 100)}%` }} />
                                </span>
                            </span>
                            <span className="ps-ranking-value">{formatDuration(g.seconds)}</span>
                        </a>
                    </li>
                );
            })}
        </ol>
    );
}
