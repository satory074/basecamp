import { jstDayKey } from "../shared/date-utils";

export interface DayGroup<T> {
    /** JST の暦日 "YYYY-MM-DD" (日付が読めない投稿は "") */
    dayKey: string;
    posts: T[];
}

/**
 * 日付降順に並んだ投稿を JST の暦日ごとにまとめる。
 * 並びは変えない (隣り合う同じ日をまとめるだけ) ので、入力が降順であることが前提。
 */
export function groupByJstDay<T extends { date: string }>(posts: readonly T[]): DayGroup<T>[] {
    const groups: DayGroup<T>[] = [];
    for (const post of posts) {
        const key = jstDayKey(post.date);
        const last = groups[groups.length - 1];
        if (last && last.dayKey === key) {
            last.posts.push(post);
        } else {
            groups.push({ dayKey: key, posts: [post] });
        }
    }
    return groups;
}
