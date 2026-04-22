/**
 * Duolingo フィード更新スクリプト
 *
 * Duolingo の公開プロフィールデータからストリーク・XP・コース情報を取得し、
 * public/data/duolingo-stats.json に差分エントリを追加する。
 *
 * GitHub Actions から定期実行される想定。
 *
 * 必要な環境変数:
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import * as fs from "fs";
import * as path from "path";

import { notifyIfNoteworthy } from "./lib/discord-notification";

const USERNAME = "satory074";
const JSON_PATH = path.join(process.cwd(), "public/data/duolingo-stats.json");
const DUOLINGO_API_URL = `https://www.duolingo.com/2017-06-30/users?username=${USERNAME}`;

const MAX_ENTRIES = 90;
const MILESTONE_INTERVAL = 50;

// ---- Types ----

interface DuolingoCourse {
    title: string;
    learningLanguage: string;
    xp: number;
    crowns: number;
}

interface DuolingoApiResponse {
    users?: Array<{
        username: string;
        streak: number;
        totalXp: number;
        courses?: DuolingoCourse[];
    }>;
}

interface DuolingoEntry {
    id: string;
    date: string;
    title: string;
    description: string;
    category: "daily" | "milestone";
    xpGained: number;
    streak: number;
}

interface CourseInfo {
    title: string;
    learningLanguage: string;
    xp: number;
}

interface DuolingoStatsFile {
    username: string;
    lastUpdated: string;
    currentStats: {
        streak: number;
        totalXp: number;
        courses: CourseInfo[];
    };
    entries: DuolingoEntry[];
}

// ---- Duolingo API ----

async function fetchDuolingoProfile(): Promise<{
    streak: number;
    totalXp: number;
    courses: CourseInfo[];
}> {
    const response = await fetch(DUOLINGO_API_URL, {
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Basecamp/1.0)",
        },
    });

    if (!response.ok) {
        throw new Error(`Duolingo API failed (${response.status}): ${await response.text()}`);
    }

    const data: DuolingoApiResponse = await response.json();

    if (!data.users || data.users.length === 0) {
        throw new Error(`User "${USERNAME}" not found on Duolingo`);
    }

    const user = data.users[0];
    const courses: CourseInfo[] = (user.courses || []).map((c) => ({
        title: c.title,
        learningLanguage: c.learningLanguage,
        xp: c.xp,
    }));

    return {
        streak: user.streak,
        totalXp: user.totalXp,
        courses,
    };
}

// ---- Load & Save ----

function loadExistingStats(): DuolingoStatsFile {
    try {
        const content = fs.readFileSync(JSON_PATH, "utf-8");
        return JSON.parse(content);
    } catch {
        return {
            username: USERNAME,
            lastUpdated: "",
            currentStats: { streak: 0, totalXp: 0, courses: [] },
            entries: [],
        };
    }
}

// ---- Entry Generation ----

function generateEntries(
    prevStats: DuolingoStatsFile["currentStats"],
    newStats: { streak: number; totalXp: number; courses: CourseInfo[] },
): DuolingoEntry[] {
    const entries: DuolingoEntry[] = [];
    const now = new Date().toISOString();
    const dateKey = now.slice(0, 10); // YYYY-MM-DD

    const xpGained = prevStats.totalXp > 0 ? newStats.totalXp - prevStats.totalXp : 0;

    // Daily XP entry (only if XP was gained)
    if (xpGained > 0) {
        const coursesDesc = newStats.courses
            .map((c) => c.title)
            .join(", ");

        entries.push({
            id: `duolingo-daily-${dateKey}`,
            date: now,
            title: `Duolingo +${xpGained} XP`,
            description: coursesDesc ? `学習中: ${coursesDesc}` : `${newStats.streak}日連続ストリーク`,
            category: "daily",
            xpGained,
            streak: newStats.streak,
        });
    }

    // Milestone entry (every MILESTONE_INTERVAL days)
    if (
        newStats.streak > 0 &&
        newStats.streak % MILESTONE_INTERVAL === 0 &&
        (prevStats.streak === 0 || prevStats.streak < newStats.streak)
    ) {
        entries.push({
            id: `duolingo-milestone-${newStats.streak}`,
            date: now,
            title: `${newStats.streak}日連続ストリーク`,
            description: `Duolingo ${newStats.streak}日連続達成! 総XP: ${newStats.totalXp.toLocaleString()}`,
            category: "milestone",
            xpGained: 0,
            streak: newStats.streak,
        });
    }

    return entries;
}

// ---- Main ----

async function main() {
    const errors: string[] = [];

    console.log("Fetching Duolingo profile...");
    const profile = await fetchDuolingoProfile();
    console.log(`Streak: ${profile.streak}, Total XP: ${profile.totalXp}, Courses: ${profile.courses.length}`);

    const existing = loadExistingStats();
    const newEntries = generateEntries(existing.currentStats, profile);

    // Merge entries (dedup by ID)
    const entryMap = new Map<string, DuolingoEntry>();
    for (const entry of existing.entries) {
        entryMap.set(entry.id, entry);
    }
    for (const entry of newEntries) {
        entryMap.set(entry.id, entry);
    }

    // Sort by date descending, keep only MAX_ENTRIES
    const mergedEntries = Array.from(entryMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, MAX_ENTRIES);

    const output: DuolingoStatsFile = {
        username: USERNAME,
        lastUpdated: new Date().toISOString(),
        currentStats: {
            streak: profile.streak,
            totalXp: profile.totalXp,
            courses: profile.courses,
        },
        entries: mergedEntries,
    };

    fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2) + "\n");
    console.log(`Saved ${mergedEntries.length} entries to ${JSON_PATH}`);

    const xpGained = existing.currentStats.totalXp > 0
        ? profile.totalXp - existing.currentStats.totalXp
        : 0;

    if (newEntries.length > 0) {
        console.log(`Added ${newEntries.length} new entries`);
    } else {
        console.log("No new entries");
    }

    const gained = Math.max(0, xpGained);
    await notifyIfNoteworthy({
        source: "Duolingo",
        status: "success",
        newItems: gained > 0 ? 1 : 0,
        metrics: [
            { name: "Streak", value: `${profile.streak}日` },
            { name: "Total XP", value: profile.totalXp.toLocaleString() },
            { name: "XP Gained", value: `+${gained}` },
            { name: "Entries", value: `${mergedEntries.length} (+${newEntries.length} new)`, inline: false },
        ],
        errors,
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await notifyIfNoteworthy({
        source: "Duolingo",
        status: "error",
        newItems: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
