/**
 * PlayStation フィード更新スクリプト
 *
 * 非公式の psn-api 経由で PlayStation Network から以下を取得し、3 つの JSON に書き込む。
 *
 *   playstation-trophies.json  獲得済みトロフィー (全タイトル・日本語名・説明文・DLC 名・獲得率)。id で差分マージ
 *   playstation-profile.json   トロフィーレベル / concept 単位のプレイ時間 / タイトル別トロフィー進捗 /
 *                              購入ライブラリ / レベルアップ履歴 のスナップショット
 *   playstation-plays.json     累計プレイ時間の差分から作るプレイ記録 (1 日 1 ゲーム 1 件)。
 *                              差分ロジックと既知の近似 (日付をまたいだセッションは終了側の日に入る等) は
 *                              scripts/lib/playstation/plays.ts を参照
 *
 * トロフィーは毎回全タイトル取り直すと重いので、lastUpdatedDateTime が変わったタイトルだけ取り直す。
 * 次のときは全タイトル取り直す: 1 日 1 回 (UTC 0〜2 時台の run、獲得率の更新用) /
 * 保存済みデータが ja-JP でない (初回移行) / PSN_FULL_REFRESH=1。
 *
 * GitHub Actions から 3 時間ごとに実行される。
 *
 * 必要な環境変数:
 *   PSN_NPSSO          - playstation.com にログインした状態で
 *                        https://ca.account.sony.com/api/v1/ssocookie から取得する 64 文字のトークン。
 *                        ~2 ヶ月で失効するため、その都度ブラウザから取り直して再設定する。
 *   PSN_FULL_REFRESH=1 - 全タイトルのトロフィーを取り直す (オプション)
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import type { AuthorizationPayload, TrophyTitle } from "psn-api";

import type {
    PsGame,
    PsGameTitle,
    PsLevelEvent,
    PsLibraryItem,
    PsPlaysFile,
    PsProfile,
    PsProfileFile,
    PsTrophiesFile,
    PsTrophyEntry,
    PsTrophyGroup,
    PsTrophySet,
    PsTrophySummary,
} from "../app/lib/playstation-types";
import { platformFromTitleId, totalTrophies } from "../app/lib/playstation-types";
import { formatDuration } from "../app/lib/shared/duration";
import { notifyIfNoteworthy } from "./lib/discord-notification";
import { readFeed, writeFeed } from "./lib/feed-storage";
import { parseIsoDuration } from "./lib/playstation/duration";
import {
    authenticate,
    fetchAllTrophyTitles,
    fetchLibrary,
    fetchPlayedTitles,
    fetchProfile,
    fetchSummary,
    fetchTitleTrophies,
    fetchTrophySetIds,
    processBatches,
    type PlayedTitle,
} from "./lib/playstation/fetch";
import { applyPlaySnapshot, emptyPlaysFile, type PlayedTitleSnapshot } from "./lib/playstation/plays";

const TROPHIES_FILE = "playstation-trophies.json";
const PROFILE_FILE = "playstation-profile.json";
const PLAYS_FILE = "playstation-plays.json";
const LOCALE = "ja-JP";

function getNpsso(): string {
    const npsso = process.env.PSN_NPSSO;
    if (!npsso) throw new Error("PSN_NPSSO is not set");
    return npsso;
}

function errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

/** 失敗しても run 全体は止めない取得 (errors に積んで fallback を返す) */
async function attempt<T>(label: string, errors: string[], fn: () => Promise<T>): Promise<T | undefined> {
    try {
        return await fn();
    } catch (err) {
        const msg = `${label}: ${errorMessage(err)}`;
        errors.push(msg);
        console.error(msg);
        return undefined;
    }
}

// ---- Games (concept 単位) ----

const HERO_IMAGE_TYPES = ["GAMEHUB_COVER_ART", "BACKGROUND_LAYER_ART", "SIXTEEN_BY_NINE_BANNER", "FOUR_BY_THREE_BANNER"];

function conceptIdOf(t: PlayedTitle): string {
    return t.concept?.id ? String(t.concept.id) : t.titleId;
}

function findImage(t: PlayedTitle, types: string[]): string | undefined {
    const images = t.concept?.media?.images ?? [];
    for (const type of types) {
        const hit = images.find((i) => i.type === type);
        if (hit?.url) return hit.url;
    }
    return undefined;
}

/** ストア表記の機種サフィックスを落とす: "CRISIS CORE –FINAL FANTASY VII– REUNION　PS4 & PS5" → "CRISIS CORE –FINAL FANTASY VII– REUNION" */
function cleanGameName(name: string): string {
    return name.replace(/[\s\u3000]+PS[45]™?(\s*(&|and|・)\s*PS[45]™?)?\s*$/i, "").trim() || name;
}

function toGameTitle(t: PlayedTitle): PsGameTitle {
    return {
        titleId: t.titleId,
        platform: platformFromTitleId(t.titleId),
        seconds: parseIsoDuration(t.playDuration),
        playCount: t.playCount,
        firstPlayed: t.firstPlayedDateTime,
        lastPlayed: t.lastPlayedDateTime,
    };
}

function buildGames(played: PlayedTitle[], setIdsByTitle: Map<string, string[]>): PsGame[] {
    const byConcept = new Map<string, PlayedTitle[]>();
    for (const t of played) {
        const key = conceptIdOf(t);
        if (!byConcept.has(key)) byConcept.set(key, []);
        byConcept.get(key)!.push(t);
    }

    const games: PsGame[] = [];
    for (const [conceptId, list] of byConcept) {
        const sorted = [...list].sort((a, b) => (a.lastPlayedDateTime < b.lastPlayedDateTime ? 1 : -1));
        const latest = sorted[0];
        const titles = sorted.map(toGameTitle);
        const platforms = [...new Set(titles.map((t) => t.platform))].sort().reverse(); // PS5 → PS4
        games.push({
            conceptId,
            name: cleanGameName(latest.localizedName || latest.name),
            platforms,
            seconds: titles.reduce((sum, t) => sum + t.seconds, 0),
            playCount: titles.reduce((sum, t) => sum + t.playCount, 0),
            firstPlayed: titles.reduce((min, t) => (t.firstPlayed < min ? t.firstPlayed : min), titles[0].firstPlayed),
            lastPlayed: latest.lastPlayedDateTime,
            icon: (latest.localizedImageUrl || latest.imageUrl)?.replace(/^http:/, "https:"),
            hero: sorted.map((t) => findImage(t, HERO_IMAGE_TYPES)).find(Boolean),
            portrait: sorted.map((t) => findImage(t, ["PORTRAIT_BANNER"])).find(Boolean),
            titles,
            trophySetIds: [...new Set(sorted.flatMap((t) => setIdsByTitle.get(t.titleId) ?? []))],
        });
    }
    return games.sort((a, b) => (a.lastPlayed < b.lastPlayed ? 1 : -1));
}

function toPlaySnapshots(played: PlayedTitle[], games: PsGame[]): PlayedTitleSnapshot[] {
    const gameByConcept = new Map(games.map((g) => [g.conceptId, g]));
    return played.map((t) => {
        const g = gameByConcept.get(conceptIdOf(t))!;
        const title = toGameTitle(t);
        return {
            titleId: t.titleId,
            conceptId: g.conceptId,
            name: g.name,
            icon: (t.localizedImageUrl || t.imageUrl)?.replace(/^http:/, "https:") || g.icon,
            platform: title.platform,
            seconds: title.seconds,
            playCount: title.playCount,
            firstPlayed: title.firstPlayed,
            lastPlayed: title.lastPlayed,
            conceptSeconds: g.seconds,
            conceptFirstPlayed: g.firstPlayed,
        };
    });
}

// ---- Trophy sets ----

function toTrophySet(t: TrophyTitle, groups: PsTrophyGroup[]): PsTrophySet {
    return {
        npCommunicationId: t.npCommunicationId,
        npServiceName: t.npServiceName,
        name: t.trophyTitleName,
        platform: t.trophyTitlePlatform,
        icon: t.trophyTitleIconUrl,
        progress: t.progress,
        earned: { ...t.earnedTrophies },
        defined: { ...t.definedTrophies },
        lastUpdated: t.lastUpdatedDateTime,
        groups,
    };
}

// ---- Main ----

async function main() {
    const errors: string[] = [];
    const warnings: string[] = [];
    const now = new Date();
    const nowIso = now.toISOString();

    console.log("Authenticating with PSN...");
    const auth: AuthorizationPayload = await authenticate(getNpsso());

    const [prevTrophies, prevProfile, prevPlays] = await Promise.all([
        readFeed<PsTrophiesFile>(TROPHIES_FILE, { accountId: "me", lastUpdated: "", trophies: [] }),
        readFeed<PsProfileFile | null>(PROFILE_FILE, null),
        readFeed<PsPlaysFile>(PLAYS_FILE, emptyPlaysFile()),
    ]);

    // ---- トロフィー ----
    console.log("Fetching trophy titles...");
    const trophyTitles = await fetchAllTrophyTitles(auth);
    if (trophyTitles.length === 0) {
        await notifyIfNoteworthy({
            source: "PlayStation",
            status: "warning",
            newItems: 0,
            metrics: [{ name: "Titles Processed", value: 0 }],
            errors: ["No titles found"],
        });
        return;
    }

    const prevSets = new Map((prevProfile?.trophySets ?? []).map((s) => [s.npCommunicationId, s]));
    const fullRefresh =
        process.env.PSN_FULL_REFRESH === "1" || prevTrophies.locale !== LOCALE || now.getUTCHours() < 3;
    const toFetch = fullRefresh
        ? trophyTitles
        : trophyTitles.filter((t) => {
              const prev = prevSets.get(t.npCommunicationId);
              return !prev || prev.lastUpdated !== t.lastUpdatedDateTime || prev.name !== t.trophyTitleName;
          });
    console.log(`Fetching trophies for ${toFetch.length}/${trophyTitles.length} titles${fullRefresh ? " (full refresh)" : ""}`);

    const fetchedGroups = new Map<string, PsTrophyGroup[]>();
    const freshEntries: PsTrophyEntry[] = [];
    await processBatches(toFetch, async (title) => {
        const res = await attempt(`trophies ${title.trophyTitleName}`, errors, () => fetchTitleTrophies(auth, title));
        if (!res) return;
        freshEntries.push(...res.entries);
        fetchedGroups.set(title.npCommunicationId, res.groups);
    });

    const trophySets = trophyTitles.map((t) =>
        toTrophySet(t, fetchedGroups.get(t.npCommunicationId) ?? prevSets.get(t.npCommunicationId)?.groups ?? []),
    );

    // ---- プレイ履歴 → concept 単位のゲーム ----
    console.log("Fetching played games...");
    const playedResult = await attempt("played games", errors, () => fetchPlayedTitles(auth));
    const played = playedResult?.games;
    let games: PsGame[] = prevProfile?.games ?? [];
    if (played) {
        const setIds =
            (await attempt("title → trophy set map", errors, () =>
                fetchTrophySetIds(auth, played.map((t) => t.titleId)),
            )) ?? new Map<string, string[]>();
        // 対応表の取得に失敗したら前回の対応を引き継ぐ
        if (setIds.size === 0) {
            for (const g of prevProfile?.games ?? []) {
                for (const t of g.titles) setIds.set(t.titleId, g.trophySetIds);
            }
        }
        games = buildGames(played, setIds);
    }

    // トロフィーに concept id を付ける (ホームのカードから /playstation の該当ゲームへリンクするため)
    const conceptBySet = new Map<string, string>();
    for (const g of games) for (const id of g.trophySetIds) conceptBySet.set(id, g.conceptId);

    const existingIds = new Set(prevTrophies.trophies.map((t) => t.id));
    const trophyMap = new Map(prevTrophies.trophies.map((t) => [t.id, t]));
    for (const entry of freshEntries) trophyMap.set(entry.id, entry);
    const trophies = [...trophyMap.values()]
        .map((t) => ({ ...t, conceptId: conceptBySet.get(t.npCommunicationId) ?? t.conceptId }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const newTrophies = trophies.filter((t) => !existingIds.has(t.id));

    // ---- プレイ記録 (累計の差分) ----
    let plays: PsPlaysFile | undefined;
    let newPlayDays = 0;
    let addedSeconds = 0;
    if (played) {
        const result = applyPlaySnapshot(prevPlays, toPlaySnapshots(played, games), now);
        plays = result.file;
        addedSeconds = result.addedSeconds;
        const prevDayIds = new Set(prevPlays.days.map((d) => d.id));
        newPlayDays = result.touched.filter((d) => !prevDayIds.has(d.id)).length;
        if (result.skipped === "gap") {
            warnings.push(
                `前回の実行から ${Math.round(result.gapHours ?? 0)} 時間空いたため、この間のプレイ時間は記録せずベースラインを取り直しました`,
            );
        }
        for (const d of result.touched) {
            console.log(`  play: ${d.dayKey} ${d.name} ${formatDuration(d.seconds)}`);
        }
    }

    // ---- トロフィーレベル / プロフィール / ライブラリ ----
    const summary: PsTrophySummary | undefined =
        (await attempt("trophy summary", errors, () => fetchSummary(auth))) ?? prevProfile?.summary;
    const profile: PsProfile =
        (await attempt("profile", errors, () => fetchProfile(auth))) ??
        prevProfile?.profile ?? { onlineId: "", profileUrl: "" };

    let levelHistory: PsLevelEvent[] = prevProfile?.levelHistory ?? [];
    let levelUps = 0;
    if (summary) {
        const last = levelHistory[levelHistory.length - 1];
        if (!last) {
            levelHistory = [{ level: summary.level, reachedAt: null }];
        } else if (summary.level > last.level) {
            levelHistory = [...levelHistory, { level: summary.level, reachedAt: nowIso }];
            levelUps = 1;
        }
    }

    const fetchedLibrary = await attempt("library", errors, () => fetchLibrary(auth));
    let library: PsLibraryItem[] = prevProfile?.library ?? [];
    let newLibrary: PsLibraryItem[] = [];
    if (fetchedLibrary) {
        const prevLib = new Map(library.map((l) => [l.titleId, l]));
        const isBaseline = prevLib.size === 0;
        const appTitleIds = playedResult?.appTitleIds ?? new Set<string>();
        library = fetchedLibrary.filter((item) => !appTitleIds.has(item.titleId)).map((item) => ({
            ...item,
            firstSeenAt: prevLib.has(item.titleId) ? prevLib.get(item.titleId)!.firstSeenAt : isBaseline ? null : nowIso,
        }));
        newLibrary = library.filter((l) => !prevLib.has(l.titleId) && !isBaseline);
    }

    // ---- 書き込み ----
    await writeFeed(TROPHIES_FILE, {
        accountId: "me",
        lastUpdated: nowIso,
        locale: LOCALE,
        trophies,
    } satisfies PsTrophiesFile);
    console.log(`Saved ${trophies.length} trophies (+${newTrophies.length} new)`);

    if (summary) {
        await writeFeed(PROFILE_FILE, {
            lastUpdated: nowIso,
            profile,
            summary,
            games,
            trophySets,
            library,
            levelHistory,
        } satisfies PsProfileFile);
        console.log(
            `Saved profile: level ${summary.level}, ${games.length} games, ${trophySets.length} trophy sets, ${library.length} library items`,
        );
    }

    if (plays) {
        await writeFeed(PLAYS_FILE, plays);
        console.log(`Saved ${plays.days.length} play days (+${formatDuration(addedSeconds)} this run)`);
    }

    // ---- 通知 ----
    // プレイ時間の加算は遊んでいる間ずっと起きるので、通知の対象は「新しい日のエントリ」だけにする
    const newItems = newTrophies.length + newPlayDays + levelUps + newLibrary.length;
    await notifyIfNoteworthy({
        source: "PlayStation",
        status: warnings.length > 0 ? "warning" : "success",
        newItems,
        summary: [
            ...newTrophies.slice(0, 5).map((t) => `🏆 ${t.title}（${t.gameName}）`),
            ...(levelUps > 0 && summary ? [`⬆️ トロフィーレベル ${summary.level}`] : []),
            ...newLibrary.slice(0, 5).map((l) => `🛒 ${l.name}`),
            ...warnings,
        ].join("\n") || undefined,
        metrics: [
            { name: "New Trophies", value: `+${newTrophies.length}` },
            { name: "Total Trophies", value: summary ? totalTrophies(summary.earned) : trophies.length },
            { name: "Play Time (this run)", value: formatDuration(addedSeconds) || "0分" },
            { name: "Titles Refreshed", value: `${toFetch.length}/${trophyTitles.length}` },
        ],
        errors,
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    await notifyIfNoteworthy({
        source: "PlayStation",
        status: "error",
        newItems: 0,
        errors: [`Fatal: ${errorMessage(error)}`],
    }).catch(() => {});
    process.exit(1);
});
