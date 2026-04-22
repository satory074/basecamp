/**
 * 日次ダイジェスト送信スクリプト
 *
 * public/data/ 以下のコミット済み JSON を読み、過去24h以内の活動と
 * 各フィードの更新鮮度をまとめて1つの Discord 通知にする。
 *
 * GitHub Actions から日次で実行される想定（23:00 JST）。
 */

import * as fs from "fs";
import * as path from "path";

import { notifyDiscord, type NotifyField } from "./lib/discord-notification";

const DATA_DIR = path.join(process.cwd(), "public/data");
const WINDOW_MS = 24 * 60 * 60 * 1000;

interface FeedConfig {
    label: string;
    file: string;
    arrayKey: string | null;
    dateField?: string;
    /** lastUpdated が expectedMaxAgeHours 以上古いと stale とみなす */
    expectedMaxAgeHours: number;
    /** true の場合、配列を集計せず lastUpdated/updatedAt のみで鮮度判定 */
    snapshotOnly?: boolean;
    snapshotLastUpdatedKey?: string;
}

const FEEDS: FeedConfig[] = [
    { label: "X", file: "x-tweets.json", arrayKey: "tweets", dateField: "date", expectedMaxAgeHours: 6 },
    { label: "Spotify", file: "spotify-plays.json", arrayKey: "plays", dateField: "date", expectedMaxAgeHours: 6 },
    { label: "Steam", file: "steam-achievements.json", arrayKey: "achievements", dateField: "date", expectedMaxAgeHours: 6 },
    { label: "Duolingo", file: "duolingo-stats.json", arrayKey: "entries", dateField: "date", expectedMaxAgeHours: 6 },
    { label: "Booklog", file: "booklog-feed.json", arrayKey: "posts", dateField: "date", expectedMaxAgeHours: 6 },
    { label: "Filmarks", file: "filmarks-feed.json", arrayKey: "posts", dateField: "date", expectedMaxAgeHours: 6 },
    { label: "FF14 Achievements", file: "ff14-achievements-feed.json", arrayKey: "posts", dateField: "date", expectedMaxAgeHours: 6 },
    { label: "FF14 Character", file: "ff14-character.json", arrayKey: null, snapshotOnly: true, snapshotLastUpdatedKey: "lastUpdated", expectedMaxAgeHours: 6 },
    { label: "Diary", file: "diary-feed.json", arrayKey: "entries", dateField: "date", expectedMaxAgeHours: 48 },
    { label: "Bio", file: "bio.json", arrayKey: null, snapshotOnly: true, snapshotLastUpdatedKey: "updatedAt", expectedMaxAgeHours: 24 * 8 },
];

interface FeedResult {
    label: string;
    recentCount: number;
    lastUpdated: string | null;
    stale: boolean;
    error?: string;
}

function readJson(file: string): unknown | null {
    try {
        return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
    } catch {
        return null;
    }
}

function toDate(v: unknown): Date | null {
    if (typeof v !== "string") return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

function summarizeFeed(cfg: FeedConfig, now: Date): FeedResult {
    const data = readJson(cfg.file);
    if (!data || typeof data !== "object") {
        return { label: cfg.label, recentCount: 0, lastUpdated: null, stale: true, error: "file missing or unreadable" };
    }

    const obj = data as Record<string, unknown>;
    const lastUpdatedRaw =
        (cfg.snapshotLastUpdatedKey && obj[cfg.snapshotLastUpdatedKey]) ||
        obj.lastUpdated ||
        obj.updatedAt;
    let lastUpdated = toDate(lastUpdatedRaw);

    // lastUpdated が無い場合、配列中の最新日付を代替とする（例: x-tweets.json）
    if (!lastUpdated && cfg.arrayKey && Array.isArray(obj[cfg.arrayKey])) {
        const arr = obj[cfg.arrayKey] as Array<Record<string, unknown>>;
        const dateField = cfg.dateField ?? "date";
        let maxTime = 0;
        for (const item of arr) {
            const d = toDate(item?.[dateField]);
            if (d && d.getTime() > maxTime) maxTime = d.getTime();
        }
        if (maxTime > 0) lastUpdated = new Date(maxTime);
    }

    const stale = !lastUpdated || now.getTime() - lastUpdated.getTime() > cfg.expectedMaxAgeHours * 60 * 60 * 1000;

    if (cfg.snapshotOnly || !cfg.arrayKey) {
        return {
            label: cfg.label,
            recentCount: 0,
            lastUpdated: lastUpdated?.toISOString() ?? null,
            stale,
        };
    }

    const arr = obj[cfg.arrayKey];
    if (!Array.isArray(arr)) {
        return { label: cfg.label, recentCount: 0, lastUpdated: lastUpdated?.toISOString() ?? null, stale: true, error: `${cfg.arrayKey} not an array` };
    }

    const cutoff = now.getTime() - WINDOW_MS;
    let recentCount = 0;
    for (const item of arr) {
        if (!item || typeof item !== "object") continue;
        const d = toDate((item as Record<string, unknown>)[cfg.dateField ?? "date"]);
        if (d && d.getTime() >= cutoff) recentCount++;
    }

    return {
        label: cfg.label,
        recentCount,
        lastUpdated: lastUpdated?.toISOString() ?? null,
        stale,
    };
}

function formatAge(iso: string | null, now: Date): string {
    if (!iso) return "unknown";
    const diffHours = (now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60);
    if (diffHours < 1) return `${Math.round(diffHours * 60)}m ago`;
    if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
    return `${Math.round(diffHours / 24)}d ago`;
}

async function main() {
    const now = new Date();
    const results = FEEDS.map((cfg) => summarizeFeed(cfg, now));

    const totalRecent = results.reduce((sum, r) => sum + r.recentCount, 0);

    const activeLines = results
        .filter((r) => r.recentCount > 0)
        .map((r) => `**${r.label}**: +${r.recentCount}`)
        .join("\n");

    const staleLines = results
        .filter((r) => r.stale)
        .map((r) => `**${r.label}**: ${formatAge(r.lastUpdated, now)}${r.error ? ` (${r.error})` : ""}`)
        .join("\n");

    const metrics: NotifyField[] = [
        { name: "Total activity (24h)", value: totalRecent, inline: true },
        { name: "Active platforms", value: results.filter((r) => r.recentCount > 0).length, inline: true },
    ];

    if (activeLines) {
        metrics.push({ name: "Recent updates", value: activeLines, inline: false });
    }

    if (staleLines) {
        metrics.push({ name: "⚠️ Stale feeds", value: staleLines, inline: false });
    }

    await notifyDiscord({
        source: "Daily Digest",
        status: staleLines ? "warning" : "success",
        summary: `過去24時間の活動: ${totalRecent}件`,
        metrics,
    });

    console.log(`Digest sent. total=${totalRecent}, stale=${results.filter((r) => r.stale).length}`);
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await notifyDiscord({
        source: "Daily Digest",
        status: "error",
        errors: [errorMsg],
    }).catch(() => {});
    process.exit(1);
});
