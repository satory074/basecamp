import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import type { PlaystationView } from "../lib/feeds/playstation";
import { tierMaterial } from "../lib/playstation-types";
import { formatDuration } from "../lib/shared/duration";
import TrophyCountRow from "./TrophyCountRow";

const TIER_LABEL = { bronze: "ブロンズ", silver: "シルバー", gold: "ゴールド", platinum: "プラチナ" } as const;

/** トロフィーレベル (進捗リング) + 種別ごとの獲得数 + 主要な数値 */
export default function ProfileHero({ view }: { view: PlaystationView }) {
    const { summary, profile, totals } = view;

    return (
        <>
            {summary && (
                <section className="ps-hero" aria-label="トロフィーレベル">
                    <div
                        className={`ps-level ps-level-${tierMaterial(summary.tier)}`}
                        style={{ ["--ps-progress" as string]: `${summary.progress}%` }}
                        role="img"
                        aria-label={`トロフィーレベル ${summary.level}（次のレベルまで ${summary.progress}%）`}
                    >
                        <div className="ps-level-inner">
                            <span className="ps-level-caption">LEVEL</span>
                            <span className="ps-level-value">{summary.level}</span>
                        </div>
                    </div>

                    <div className="ps-hero-body">
                        {profile?.onlineId && (
                            <p className="ps-hero-id">
                                {profile.onlineId}
                                <span className="ps-hero-tier">{TIER_LABEL[tierMaterial(summary.tier)]}ティア</span>
                            </p>
                        )}
                        <div
                            className="ps-bar"
                            role="progressbar"
                            aria-label="次のレベルまで"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={summary.progress}
                        >
                            <span style={{ width: `${summary.progress}%` }} />
                        </div>
                        <p className="ps-hero-meta">
                            次のレベルまで {summary.progress}%
                            {summary.points !== undefined && summary.levelNextPoints !== undefined && (
                                <>（{summary.points.toLocaleString("en-US")} / {summary.levelNextPoints.toLocaleString("en-US")} pt）</>
                            )}
                        </p>
                        <TrophyCountRow earned={summary.earned} />
                    </div>
                </section>
            )}

            <PlatformDashboard
                platform="playstation"
                stats={[
                    { label: "総プレイ時間", value: formatDuration(totals.seconds) },
                    { label: "プレイしたゲーム", value: `${totals.games}本` },
                    { label: "トロフィー", value: totals.trophies },
                    { label: "ライブラリ", value: `${totals.library}本（未プレイ ${totals.unplayed}）` },
                ]}
            />
        </>
    );
}
