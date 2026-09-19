/**
 * PlayStation のプレイ記録: 累計プレイ時間のスナップショット差分 → 「1 日 1 ゲーム 1 件」のエントリ。
 *
 * PSN はセッション単位の履歴を返さず、titleId ごとの累計 (playDuration / playCount / lastPlayedDateTime) しか無い。
 * そこで 3 時間ごとの run で前回の累計 (baseline) との差分を取り、`lastPlayedDateTime` の JST 暦日の
 * (dayKey, conceptId) エントリに **加算で** upsert する。同じ日に何度 run しても合計が積み上がる。
 *
 * 既知の近似:
 *   - 日付をまたいだセッションは、全部が終了側 (lastPlayed の日) に入る
 *   - 前回 run から MAX_GAP_HOURS 以上空いた (NPSSO 失効などの障害明け) ときは、差分が何日分か分からないので
 *     計上せず baseline だけ取り直す
 */

import type { PsPlayDay, PsPlaysFile } from "../../../app/lib/playstation-types";
import { jstDayKey } from "../diary/day";

/** これ未満の増分はメニュー画面を開いただけ等とみなして捨てる */
export const MIN_DELTA_SECONDS = 60;
/** これ以上 run が空いたら差分を計上しない */
export const MAX_GAP_HOURS = 30;

export interface PlayedTitleSnapshot {
    titleId: string;
    conceptId: string;
    name: string;
    icon?: string;
    platform: string;
    seconds: number;
    playCount: number;
    firstPlayed: string;
    lastPlayed: string;
    /** concept (全機種) の累計秒数 */
    conceptSeconds: number;
    /** concept (全機種) で最初に遊んだ時刻 */
    conceptFirstPlayed: string;
}

export interface PlaySnapshotResult {
    file: PsPlaysFile;
    /** 今回の run で作成 / 加算されたエントリ (加算後の値) */
    touched: PsPlayDay[];
    /** 今回の run で計上した秒数の合計 */
    addedSeconds: number;
    /** 計上しなかった理由 (baseline だけ更新した) */
    skipped?: "first-run" | "gap";
    gapHours?: number;
}

export function emptyPlaysFile(): PsPlaysFile {
    return { lastUpdated: "", since: null, baseline: { capturedAt: null, titles: {} }, days: [] };
}

export function applyPlaySnapshot(prev: PsPlaysFile, titles: PlayedTitleSnapshot[], now: Date): PlaySnapshotResult {
    const capturedAt = prev.baseline.capturedAt ? new Date(prev.baseline.capturedAt) : null;
    const hasBaseline = capturedAt !== null && !isNaN(capturedAt.getTime()) && Object.keys(prev.baseline.titles).length > 0;
    const gapHours = hasBaseline ? (now.getTime() - capturedAt.getTime()) / 3_600_000 : undefined;

    let skipped: PlaySnapshotResult["skipped"];
    if (!hasBaseline) skipped = "first-run";
    else if (gapHours !== undefined && gapHours >= MAX_GAP_HOURS) skipped = "gap";

    const days = new Map(prev.days.map((d) => [d.id, d]));
    const touched = new Map<string, PsPlayDay>();
    let addedSeconds = 0;

    if (!skipped) {
        for (const t of titles) {
            const before = prev.baseline.titles[t.titleId];
            let delta: number;
            let sessions: number;
            if (before) {
                delta = t.seconds - before.seconds;
                sessions = Math.max(0, t.playCount - before.playCount);
            } else if (new Date(t.firstPlayed) >= capturedAt!) {
                // 前回 run の後に初めて遊んだタイトル (新作・別機種版)
                delta = t.seconds;
                sessions = t.playCount;
            } else {
                // 前回は API に出ていなかった古いタイトル (ページング漏れ等)。今回から baseline に入れる
                continue;
            }
            if (delta < MIN_DELTA_SECONDS) continue;

            const lastAt = new Date(t.lastPlayed);
            const dayKey = jstDayKey(isNaN(lastAt.getTime()) ? now : lastAt);
            const id = `psplay-${dayKey}-${t.conceptId}`;
            const existing = days.get(id);
            const entry: PsPlayDay = existing
                ? {
                      ...existing,
                      seconds: existing.seconds + delta,
                      sessions: existing.sessions + sessions,
                      lastAt: t.lastPlayed > existing.lastAt ? t.lastPlayed : existing.lastAt,
                      totalSecondsAfter: t.conceptSeconds,
                      // 同じ日に別機種版を遊んだら、最後に遊んだ版のアイコン・機種を出す
                      titleId: t.lastPlayed > existing.lastAt ? t.titleId : existing.titleId,
                      platform: t.lastPlayed > existing.lastAt ? t.platform : existing.platform,
                  }
                : {
                      id,
                      dayKey,
                      conceptId: t.conceptId,
                      titleId: t.titleId,
                      name: t.name,
                      icon: t.icon,
                      platform: t.platform,
                      seconds: delta,
                      sessions,
                      lastAt: t.lastPlayed,
                      totalSecondsAfter: t.conceptSeconds,
                      isFirst: jstDayKey(new Date(t.conceptFirstPlayed)) === dayKey || undefined,
                  };
            days.set(id, entry);
            touched.set(id, entry);
            addedSeconds += delta;
        }
    }

    const baselineTitles: PsPlaysFile["baseline"]["titles"] = {};
    for (const t of titles) {
        baselineTitles[t.titleId] = { seconds: t.seconds, playCount: t.playCount, lastPlayed: t.lastPlayed };
    }

    const sortedDays = [...days.values()].sort((a, b) =>
        a.lastAt === b.lastAt ? a.id.localeCompare(b.id) : a.lastAt < b.lastAt ? 1 : -1,
    );

    return {
        file: {
            lastUpdated: now.toISOString(),
            since: prev.since ?? now.toISOString(),
            baseline: { capturedAt: now.toISOString(), titles: baselineTitles },
            days: sortedDays,
        },
        touched: [...touched.values()],
        addedSeconds,
        skipped,
        gapHours,
    };
}
