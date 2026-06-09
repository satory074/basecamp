/**
 * PlayStation トロフィーフィード更新スクリプト
 *
 * 非公式の psn-api 経由で PlayStation Network から最近獲得したトロフィーを取得し、
 * playstation-trophies.json に差分マージする。
 *
 * GitHub Actions から定期実行される想定。
 *
 * 必要な環境変数:
 *   PSN_NPSSO          - playstation.com にログインした状態で
 *                        https://ca.account.sony.com/api/v1/ssocookie から取得する 64 文字のトークン。
 *                        ~2 ヶ月で失効するため、その都度ブラウザから取り直して再設定する。
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import {
    exchangeNpssoForAccessCode,
    exchangeAccessCodeForAuthTokens,
    getUserTitles,
    getTitleTrophies,
    getUserTrophiesEarnedForTitle,
    type AuthorizationPayload,
    type TrophyTitle,
} from "psn-api";

import { notifyIfNoteworthy } from "./lib/discord-notification";
import { readFeed, writeFeed } from "./lib/feed-storage";

const FEED_FILE = "playstation-trophies.json";

// 直近の更新があったタイトルのみ処理する（古いゲームのトロフィーは不変なので dedup で吸収される）
const MAX_TITLES = 15;
// getUserTitles で一度に取得する件数（上から MAX_TITLES 件だけ処理）
const TITLE_LIMIT = 50;
const API_DELAY_MS = 500;
const BATCH_SIZE = 3;

// ---- Types ----

interface TrophyEntry {
    id: string;
    npCommunicationId: string;
    gameName: string;
    title: string;
    icon: string;
    trophyType: string; // "bronze" | "silver" | "gold" | "platinum"
    earnedRate?: string; // 全プレイヤー中の獲得率（%）
    date: string;
}

interface PlaystationTrophiesFile {
    accountId: string;
    lastUpdated: string;
    trophies: TrophyEntry[];
}

// ---- Helpers ----

function getNpsso(): string {
    const npsso = process.env.PSN_NPSSO;
    if (!npsso) throw new Error("PSN_NPSSO is not set");
    return npsso;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processBatches<T, R>(items: T[], processor: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);
        if (i + BATCH_SIZE < items.length) {
            await delay(API_DELAY_MS);
        }
    }
    return results;
}

// ---- PSN API ----

async function authenticate(): Promise<AuthorizationPayload> {
    const accessCode = await exchangeNpssoForAccessCode(getNpsso());
    const authorization = await exchangeAccessCodeForAuthTokens(accessCode);
    return authorization;
}

/** 1 タイトル分の獲得済みトロフィーを TrophyEntry[] に変換する */
async function fetchTitleTrophies(
    auth: AuthorizationPayload,
    title: TrophyTitle,
): Promise<TrophyEntry[]> {
    // PS3/PS4/Vita は "trophy"、PS5 は "trophy2"。TrophyTitle が値を持っているのでそのまま使う。
    const npServiceName = title.npServiceName;

    const [defs, earned] = await Promise.all([
        getTitleTrophies(auth, title.npCommunicationId, "all", { npServiceName }),
        getUserTrophiesEarnedForTitle(auth, "me", title.npCommunicationId, "all", { npServiceName }),
    ]);

    // trophyId で定義（名前/アイコン）と獲得状況（獲得日/レア度）をマージ
    const defMap = new Map<number, (typeof defs.trophies)[number]>();
    for (const def of defs.trophies) {
        defMap.set(def.trophyId, def);
    }

    const entries: TrophyEntry[] = [];
    for (const t of earned.trophies) {
        if (!t.earned || !t.earnedDateTime) continue;
        const def = defMap.get(t.trophyId);
        entries.push({
            id: `playstation-${title.npCommunicationId}-${t.trophyId}`,
            npCommunicationId: title.npCommunicationId,
            gameName: title.trophyTitleName,
            title: def?.trophyName ?? `Trophy ${t.trophyId}`,
            icon: def?.trophyIconUrl ?? "",
            trophyType: t.trophyType,
            earnedRate: t.trophyEarnedRate,
            date: t.earnedDateTime,
        });
    }
    return entries;
}

// ---- Load & Save ----

async function loadExisting(): Promise<PlaystationTrophiesFile> {
    return readFeed<PlaystationTrophiesFile>(FEED_FILE, {
        accountId: "me",
        lastUpdated: "",
        trophies: [],
    });
}

// ---- Main ----

async function main() {
    const errors: string[] = [];

    console.log("Authenticating with PSN...");
    const auth = await authenticate();

    console.log("Fetching user titles...");
    const { trophyTitles } = await getUserTitles(auth, "me", { limit: TITLE_LIMIT });
    const titles = trophyTitles.slice(0, MAX_TITLES);
    console.log(`Processing ${titles.length} most-recently-updated titles`);

    if (titles.length === 0) {
        await notifyIfNoteworthy({
            source: "PlayStation",
            status: "warning",
            newItems: 0,
            metrics: [{ name: "Titles Processed", value: 0 }],
            errors: ["No titles found"],
        });
        return;
    }

    // 各タイトルのトロフィーを取得（1 タイトル失敗しても他は続行）
    const perTitle = await processBatches(titles, async (title) => {
        try {
            return await fetchTitleTrophies(auth, title);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`${title.trophyTitleName}: ${msg}`);
            console.error(`Failed to fetch trophies for ${title.trophyTitleName}: ${msg}`);
            return [] as TrophyEntry[];
        }
    });

    const freshEntries = perTitle.flat();
    console.log(`Collected ${freshEntries.length} earned trophies`);

    // 既存とマージ（id で dedup）
    const existing = await loadExisting();
    const entryMap = new Map<string, TrophyEntry>();
    for (const entry of existing.trophies) {
        entryMap.set(entry.id, entry);
    }
    for (const entry of freshEntries) {
        entryMap.set(entry.id, entry);
    }

    const merged = Array.from(entryMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const newCount = Math.max(0, merged.length - existing.trophies.length);

    const output: PlaystationTrophiesFile = {
        accountId: "me",
        lastUpdated: new Date().toISOString(),
        trophies: merged,
    };

    await writeFeed(FEED_FILE, output);
    console.log(`Saved ${merged.length} trophies to ${FEED_FILE} (+${newCount} new)`);

    await notifyIfNoteworthy({
        source: "PlayStation",
        status: "success",
        newItems: newCount,
        metrics: [
            { name: "Titles Processed", value: titles.length },
            { name: "New Trophies", value: `+${newCount}` },
            { name: "Total Trophies", value: merged.length },
        ],
        errors,
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await notifyIfNoteworthy({
        source: "PlayStation",
        status: "error",
        newItems: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
