import Image from "next/image";
import { gameAnchor, type PsTrophyEntry } from "../lib/playstation-types";
import { jstDate } from "./format";

const TYPE_LABEL: Record<string, string> = { platinum: "プラチナ", gold: "ゴールド", silver: "シルバー", bronze: "ブロンズ" };

/** 獲得率の低い順に並べたトロフィー */
export default function RareTrophies({ trophies }: { trophies: PsTrophyEntry[] }) {
    if (trophies.length === 0) return null;
    return (
        <ul className="ps-rare">
            {trophies.map((t) => (
                <li key={t.id} className="ps-rare-item">
                    <a href={t.conceptId ? `#${gameAnchor(t.conceptId)}` : undefined} className="ps-rare-link">
                        <span className="ps-rare-icon">
                            {t.icon && <Image src={t.icon} alt="" width={48} height={48} />}
                        </span>
                        <span className="ps-rare-body">
                            <span className="ps-rare-name">
                                <span className={`ps-trophy-dot ps-trophy-${t.trophyType}`} aria-hidden="true" />
                                {t.title}
                                <span className="sr-only">（{TYPE_LABEL[t.trophyType] ?? t.trophyType}）</span>
                            </span>
                            {t.detail && <span className="ps-rare-detail">{t.detail}</span>}
                            <span className="ps-rare-meta">
                                {t.gameName} · {jstDate(t.date)}
                            </span>
                        </span>
                        <span className="ps-rare-rate">
                            {t.earnedRate}
                            <small>%</small>
                        </span>
                    </a>
                </li>
            ))}
        </ul>
    );
}
