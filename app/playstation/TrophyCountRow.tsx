import type { TrophyCounts, TrophyType } from "../lib/playstation-types";

const ORDER: TrophyType[] = ["platinum", "gold", "silver", "bronze"];
const LABEL: Record<TrophyType, string> = { platinum: "プラチナ", gold: "ゴールド", silver: "シルバー", bronze: "ブロンズ" };

interface TrophyCountRowProps {
    earned: TrophyCounts;
    /** 渡すと「獲得 / 定義」で出す */
    defined?: TrophyCounts;
    size?: "sm" | "md";
}

/** トロフィー種別ごとの個数。色は丸だけに使い、種別名は常にテキストでも出す (色だけに頼らない) */
export default function TrophyCountRow({ earned, defined, size = "md" }: TrophyCountRowProps) {
    const types = defined ? ORDER.filter((t) => defined[t] > 0) : ORDER;
    return (
        <ul className={`ps-trophy-counts ps-trophy-counts-${size}`}>
            {types.map((t) => (
                <li key={t} className="ps-trophy-count">
                    <span className={`ps-trophy-dot ps-trophy-${t}`} aria-hidden="true" />
                    <span className="ps-trophy-count-label">{LABEL[t]}</span>
                    <span className="ps-trophy-count-value">
                        {earned[t]}
                        {defined && <span className="ps-trophy-count-total">/{defined[t]}</span>}
                    </span>
                </li>
            ))}
        </ul>
    );
}
