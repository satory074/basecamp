import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";

/** 1杯分。金額・商品画像はフィードに含まれない */
export interface AlcoItem {
    id: string;
    /** 飲んだ時刻の ISO 8601 */
    at: string;
    name: string;
    volumeMl: number;
    abv: number;
    alcoholG: number;
    kcal?: number;
}

/** 1日分。items が空なら休肝日 */
export interface AlcoDay {
    dayKey: string;
    /** dayKey の 12:00 JST 固定。日単位の代表時刻（at 欠落時のフォールバック） */
    date: string;
    totalG: number;
    count: number;
    items: AlcoItem[];
}

interface AlcoFileData {
    lastUpdated: string;
    days: AlcoDay[];
}

async function readAlcoFile(): Promise<AlcoFileData> {
    return readFeedJson<AlcoFileData>("alco-drinks.json");
}

/** 日別データ。ダッシュボードの集計（休肝日ストリーク等）に使う。新しい順 */
export async function getAlcoDays(): Promise<AlcoDay[]> {
    try {
        const data = await readAlcoFile();
        return (data.days ?? []).slice().sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1));
    } catch {
        return [];
    }
}

/** 1杯 = 1件のフィード。休肝日（items が空の日）は記事化しない */
export async function getAlcoPosts(): Promise<Post[]> {
    try {
        const data = await readAlcoFile();
        const posts: Post[] = (data.days ?? []).flatMap((day) =>
            day.items.map((item) => ({
                id: `alco-${item.id}`,
                title: `${item.name} ${item.volumeMl}ml`,
                url: "#", // 内部専用（外部パーマリンクを持たない）
                date: item.at ?? day.date,
                platform: "alco",
                description: `純アルコール ${item.alcoholG}g${item.kcal ? ` ・ 約${item.kcal}kcal` : ""}`,
            })),
        );
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}

export interface AlcoSummary {
    /** 直近7日の純アルコール合計 (g) */
    last7dG: number;
    /** 今月の休肝日数 */
    restDaysThisMonth: number;
    /** 最新の公開日から遡った連続休肝日数 */
    restDayStreak: number;
    /** 記録が公開されている日数 */
    publishedDays: number;
}

/** JST の 'YYYY-MM-DD' */
function jstDayKey(d: Date): string {
    return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function shiftDayKey(dayKey: string, days: number): string {
    const [y, m, d] = dayKey.split("-").map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + days));
    return t.toISOString().slice(0, 10);
}

/**
 * ダッシュボード用の集計。
 * days は「公開された日」だけを含むので、休肝日ストリークは
 * 最新の公開日から連続する count === 0 の日を数える。
 */
export function summarizeAlcoDays(days: AlcoDay[], now = new Date()): AlcoSummary {
    const byDay = new Map(days.map((d) => [d.dayKey, d]));
    const todayKey = jstDayKey(now);

    let last7dG = 0;
    for (let i = 0; i < 7; i++) {
        last7dG += byDay.get(shiftDayKey(todayKey, -i))?.totalG ?? 0;
    }

    const monthPrefix = todayKey.slice(0, 7);
    const restDaysThisMonth = days.filter(
        (d) => d.dayKey.startsWith(monthPrefix) && d.count === 0,
    ).length;

    let restDayStreak = 0;
    const newest = days[0]?.dayKey;
    if (newest) {
        for (let d = newest; byDay.get(d)?.count === 0 && restDayStreak < 365; d = shiftDayKey(d, -1)) {
            restDayStreak++;
        }
    }

    return {
        last7dG: Math.round(last7dG * 10) / 10,
        restDaysThisMonth,
        restDayStreak,
        publishedDays: days.length,
    };
}
