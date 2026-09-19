import type { PsCalendarDay, PsCalendarView } from "../lib/feeds/playstation";
import { formatDuration } from "../lib/shared/duration";
import { dayKeyLabel } from "./format";

const WEEKS = 26;
const CELL = 11;
const STEP = 13;
const LEFT = 18;
const TOP = 14;
const WEEKDAY_LABELS = ["月", "", "水", "", "金", "", ""];
/** 濃さの段階: なし / 1 時間未満 / 2 時間未満 / 4 時間未満 / 4 時間以上 */
const LEVEL_OPACITY = [0, 0.3, 0.55, 0.8, 1];
const LEVEL_LABELS = ["なし", "1時間未満", "2時間未満", "4時間未満", "4時間以上"];

function level(seconds: number): number {
    if (seconds <= 0) return 0;
    if (seconds < 3600) return 1;
    if (seconds < 7200) return 2;
    if (seconds < 14400) return 3;
    return 4;
}

function shiftDayKey(dayKey: string, days: number): string {
    const [y, m, d] = dayKey.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 月曜 = 0 */
function weekdayIndex(dayKey: string): number {
    const [y, m, d] = dayKey.split("-").map(Number);
    return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

function cellTitle(dayKey: string, day: PsCalendarDay | undefined, beforeSince: boolean): string {
    if (beforeSince) return `${dayKeyLabel(dayKey)}: 記録前`;
    if (!day) return `${dayKeyLabel(dayKey)}: プレイなし`;
    const games = day.games.map((g) => `${g.name} ${formatDuration(g.seconds)}`).join("、");
    return `${dayKeyLabel(dayKey)}: ${formatDuration(day.seconds)}（${games}）`;
}

/** 直近 26 週のプレイ時間ヒートマップ。累計プレイ時間の差分から作るので、記録開始より前の日は「記録前」 */
export default function PlayCalendar({ calendar }: { calendar: PsCalendarView }) {
    const { today, since } = calendar;
    const byDay = new Map(calendar.days.map((d) => [d.dayKey, d]));
    const start = shiftDayKey(today, -(weekdayIndex(today) + (WEEKS - 1) * 7));

    const cells: { key: string; x: number; y: number; opacity: number; before: boolean; title: string }[] = [];
    const months: { x: number; label: string }[] = [];
    for (let w = 0; w < WEEKS; w++) {
        for (let d = 0; d < 7; d++) {
            const dayKey = shiftDayKey(start, w * 7 + d);
            if (dayKey > today) continue;
            if (dayKey.endsWith("-01") || (w === 0 && d === 0)) {
                months.push({ x: LEFT + w * STEP, label: `${Number(dayKey.slice(5, 7))}月` });
            }
            const day = byDay.get(dayKey);
            const before = since === null || dayKey < since;
            cells.push({
                key: dayKey,
                x: LEFT + w * STEP,
                y: TOP + d * STEP,
                opacity: LEVEL_OPACITY[level(day?.seconds ?? 0)],
                before,
                title: cellTitle(dayKey, day, before),
            });
        }
    }
    // 月初が近すぎるラベル (先頭列と 1 日の列が隣接するとき) は後ろを優先する
    const monthLabels = months.filter((m, i) => i === months.length - 1 || months[i + 1].x - m.x >= STEP * 3);

    const width = LEFT + WEEKS * STEP;
    const height = TOP + 7 * STEP;

    return (
        <div className="ps-calendar">
            <svg
                className="ps-calendar-svg"
                viewBox={`0 0 ${width} ${height}`}
                width={width}
                height={height}
                role="img"
                aria-label={`直近${WEEKS}週のプレイ時間。直近30日で ${calendar.activeDays30} 日、合計 ${formatDuration(calendar.last30)}`}
            >
                {monthLabels.map((m) => (
                    <text key={`${m.x}-${m.label}`} x={m.x} y={10} className="ps-calendar-label">
                        {m.label}
                    </text>
                ))}
                {WEEKDAY_LABELS.map((label, i) =>
                    label ? (
                        <text key={label} x={0} y={TOP + i * STEP + CELL - 2} className="ps-calendar-label">
                            {label}
                        </text>
                    ) : null,
                )}
                {cells.map((c) => (
                    <rect
                        key={c.key}
                        x={c.x}
                        y={c.y}
                        width={CELL}
                        height={CELL}
                        rx={2}
                        className={c.before ? "ps-calendar-cell is-before" : c.opacity > 0 ? "ps-calendar-cell is-played" : "ps-calendar-cell"}
                        style={c.opacity > 0 ? { fillOpacity: c.opacity } : undefined}
                    >
                        <title>{c.title}</title>
                    </rect>
                ))}
            </svg>

            <div className="ps-calendar-legend" aria-hidden="true">
                {LEVEL_OPACITY.map((o, i) => (
                    <span key={i} className="ps-calendar-legend-item" title={LEVEL_LABELS[i]}>
                        <span
                            className={o > 0 ? "ps-calendar-swatch is-played" : "ps-calendar-swatch"}
                            style={o > 0 ? { opacity: o } : undefined}
                        />
                    </span>
                ))}
                <span className="ps-calendar-legend-text">1時間 / 2時間 / 4時間 区切り</span>
            </div>

            <dl className="ps-calendar-stats">
                <div>
                    <dt>直近7日</dt>
                    <dd>{formatDuration(calendar.last7)}</dd>
                </div>
                <div>
                    <dt>直近30日</dt>
                    <dd>{formatDuration(calendar.last30)}</dd>
                </div>
                <div>
                    <dt>遊んだ日（30日中）</dt>
                    <dd>{calendar.activeDays30}日</dd>
                </div>
                {calendar.best && (
                    <div>
                        <dt>最長の日</dt>
                        <dd>
                            {formatDuration(calendar.best.seconds)}
                            <span className="ps-calendar-stat-sub">{dayKeyLabel(calendar.best.dayKey)}</span>
                        </dd>
                    </div>
                )}
            </dl>

            <p className="ps-note">
                PSN はセッション単位の履歴を返さないため、3時間ごとに累計プレイ時間を取得して増えた分を
                最後に遊んだ日に計上しています{since ? `（${since.replace(/-/g, "/")} から記録）` : ""}。
                日付をまたいだプレイは翌日側に入ります。
            </p>
        </div>
    );
}
