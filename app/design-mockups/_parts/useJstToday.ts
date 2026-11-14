"use client";

import { useSyncExternalStore } from "react";
import { jstDayKey } from "@/app/lib/shared/date-utils";

const noop = () => () => {};

/**
 * ブラウザでの「今日」(JST の "YYYY-MM-DD")。サーバー描画とハイドレーション中は null。
 *
 * 静的 HTML は UTC のビルド時刻で書き出されるので、「今日 / 昨日」をそこに焼くと
 * 半日で古くなり、ブラウザの再描画と食い違う。null の間は絶対日付だけを出し、
 * ハイドレーション後に相対ラベルを足す。
 */
export function useJstToday(): string | null {
    return useSyncExternalStore(
        noop,
        () => jstDayKey(new Date().toISOString()),
        () => null,
    );
}
