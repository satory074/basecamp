/**
 * 同じプラットフォームが続く投稿を畳む。
 *
 * ホームのフィードは時系列のまま見せるが、Spotify の再生や X のいいねのように
 * 同じ種類が 10 件以上続くと他の出来事が埋もれる。そこで `minRun` 件以上の連続は
 * 先頭 1 件 + 「＋N 件」の行にまとめ、残りは開いたときだけ出す。
 *
 * 並び順は変えない。展開すれば入力と同じ順で全件が戻る (collapse.test.ts の不変条件)。
 * 日をまたいで畳まないよう、呼び出し側が 1 日分ずつ渡す。
 */
export type FeedRow<T> =
    | { kind: "item"; item: T }
    | { kind: "run"; key: string; platform: string; head: T; rest: T[] };

/** これ未満の連続はそのまま並べる (2 件連続は畳まない) */
export const MIN_RUN = 3;

export function collapseRuns<T extends { id: string; platform: string }>(
    items: readonly T[],
    minRun: number = MIN_RUN,
): FeedRow<T>[] {
    const rows: FeedRow<T>[] = [];
    let i = 0;
    while (i < items.length) {
        let j = i + 1;
        while (j < items.length && items[j].platform === items[i].platform) j++;
        const run = items.slice(i, j);
        if (run.length >= minRun) {
            const [head, ...rest] = run;
            rows.push({ kind: "run", key: `run-${head.platform}-${head.id}`, platform: head.platform, head, rest });
        } else {
            for (const item of run) rows.push({ kind: "item", item });
        }
        i = j;
    }
    return rows;
}

/** 畳んだ行を元の並びに戻す */
export function expandRows<T>(rows: readonly FeedRow<T>[]): T[] {
    return rows.flatMap((row) => (row.kind === "item" ? [row.item] : [row.head, ...row.rest]));
}
