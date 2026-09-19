/**
 * PSN API 呼び出し (非公式 psn-api)。
 *
 * トロフィー名・説明文・DLC 名は `Accept-Language: ja-JP` で日本語版を取る。
 * 取得しないもの (プライバシー / 用途なし): オンライン状態、フレンド・ブロック・申請、使用機器、地域、本名。
 */

import {
    exchangeAccessCodeForAuthTokens,
    exchangeNpssoForAccessCode,
    getProfileFromUserName,
    getPurchasedGames,
    getTitleTrophies,
    getTitleTrophyGroups,
    getUserPlayedGames,
    getUserTitles,
    getUserTrophiesEarnedForTitle,
    getUserTrophiesForSpecificTitle,
    getUserTrophyGroupEarningsForTitle,
    getUserTrophyProfileSummary,
    type AuthorizationPayload,
    type TrophyTitle,
    type UserPlayedGamesResponse,
} from "psn-api";

import type {
    PsLibraryItem,
    PsProfile,
    PsTrophyEntry,
    PsTrophyGroup,
    PsTrophySummary,
    TrophyCounts,
} from "../../../app/lib/playstation-types";

const JA = { "Accept-Language": "ja-JP" };
const API_DELAY_MS = 500;
const BATCH_SIZE = 3;
const PAGE_SIZE = 100;
/** getUserTrophiesForSpecificTitle は 1 リクエスト 5 titleId まで */
const SPECIFIC_TITLE_CHUNK = 5;

export type PlayedTitle = UserPlayedGamesResponse["titles"][number];

export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processBatches<T, R>(items: T[], processor: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        results.push(...(await Promise.all(batch.map(processor))));
        if (i + BATCH_SIZE < items.length) await delay(API_DELAY_MS);
    }
    return results;
}

function counts(c: Partial<TrophyCounts> | undefined): TrophyCounts {
    return { bronze: c?.bronze ?? 0, silver: c?.silver ?? 0, gold: c?.gold ?? 0, platinum: c?.platinum ?? 0 };
}

export async function authenticate(npsso: string): Promise<AuthorizationPayload> {
    const accessCode = await exchangeNpssoForAccessCode(npsso);
    return exchangeAccessCodeForAuthTokens(accessCode);
}

// ---- Profile / Summary ----

export async function fetchProfile(auth: AuthorizationPayload): Promise<PsProfile> {
    const { profile } = await getProfileFromUserName(auth, "me");
    const avatar = profile.avatarUrls?.find((a) => a.size === "l") ?? profile.avatarUrls?.[0];
    return {
        onlineId: profile.onlineId,
        avatarUrl: avatar?.avatarUrl?.replace(/^http:/, "https:"),
        profileUrl: `https://profile.playstation.com/${profile.onlineId}`,
    };
}

/** trophyPoint / trophyLevelBasePoint / trophyLevelNextPoint は実レスポンスにはあるが psn-api の型に無い */
interface SummaryExtras {
    trophyPoint?: number;
    trophyLevelBasePoint?: number;
    trophyLevelNextPoint?: number;
}

export async function fetchSummary(auth: AuthorizationPayload): Promise<PsTrophySummary> {
    const s = await getUserTrophyProfileSummary(auth, "me");
    const extras = s as typeof s & SummaryExtras;
    return {
        level: Number(s.trophyLevel),
        progress: s.progress,
        tier: s.tier,
        points: extras.trophyPoint,
        levelBasePoints: extras.trophyLevelBasePoint,
        levelNextPoints: extras.trophyLevelNextPoint,
        earned: counts(s.earnedTrophies),
    };
}

// ---- Trophies ----

/** トロフィーを持つ全タイトル (最近更新された順) */
export async function fetchAllTrophyTitles(auth: AuthorizationPayload): Promise<TrophyTitle[]> {
    const all: TrophyTitle[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
        const res = await getUserTitles(auth, "me", { limit: PAGE_SIZE, offset, headerOverrides: JA });
        all.push(...res.trophyTitles);
        if (res.trophyTitles.length < PAGE_SIZE || all.length >= res.totalItemCount) break;
        await delay(API_DELAY_MS);
    }
    return all;
}

export interface TitleTrophiesResult {
    entries: PsTrophyEntry[];
    groups: PsTrophyGroup[];
}

/** 1 タイトル分の獲得済みトロフィー (+ DLC グループ別の進捗) */
export async function fetchTitleTrophies(auth: AuthorizationPayload, title: TrophyTitle): Promise<TitleTrophiesResult> {
    // PS3/PS4/Vita は "trophy"、PS5 は "trophy2"。TrophyTitle が値を持っているのでそのまま使う。
    const npServiceName = title.npServiceName;
    const id = title.npCommunicationId;

    const [defs, earned, groupDefs, groupEarnings] = await Promise.all([
        getTitleTrophies(auth, id, "all", { npServiceName, headerOverrides: JA }),
        getUserTrophiesEarnedForTitle(auth, "me", id, "all", { npServiceName, headerOverrides: JA }),
        title.hasTrophyGroups ? getTitleTrophyGroups(auth, id, { npServiceName, headerOverrides: JA }) : null,
        title.hasTrophyGroups ? getUserTrophyGroupEarningsForTitle(auth, "me", id, { npServiceName, headerOverrides: JA }) : null,
    ]);

    const groupNames = new Map<string, string>();
    const groups: PsTrophyGroup[] = [];
    if (groupDefs && groupEarnings) {
        const earnedByGroup = new Map(groupEarnings.trophyGroups.map((g) => [g.trophyGroupId, g]));
        for (const g of groupDefs.trophyGroups) {
            groupNames.set(g.trophyGroupId, g.trophyGroupName);
            const e = earnedByGroup.get(g.trophyGroupId);
            groups.push({
                id: g.trophyGroupId,
                name: g.trophyGroupName,
                icon: g.trophyGroupIconUrl || undefined,
                progress: e?.progress ?? 0,
                earned: counts(e?.earnedTrophies),
                defined: counts(g.definedTrophies),
            });
        }
    }

    // trophyId で定義 (名前/説明/アイコン/グループ) と獲得状況 (獲得日/レア度) をマージ
    const defMap = new Map(defs.trophies.map((d) => [d.trophyId, d]));
    const entries: PsTrophyEntry[] = [];
    for (const t of earned.trophies) {
        if (!t.earned || !t.earnedDateTime) continue;
        const def = defMap.get(t.trophyId);
        const groupId = def?.trophyGroupId;
        entries.push({
            id: `playstation-${id}-${t.trophyId}`,
            npCommunicationId: id,
            gameName: title.trophyTitleName,
            title: def?.trophyName ?? `Trophy ${t.trophyId}`,
            detail: def?.trophyDetail || undefined,
            icon: def?.trophyIconUrl ?? "",
            trophyType: t.trophyType,
            earnedRate: t.trophyEarnedRate,
            groupName: groupId && groupId !== "default" ? groupNames.get(groupId) : undefined,
            platform: title.trophyTitlePlatform,
            date: t.earnedDateTime,
        });
    }
    return { entries, groups };
}

/** プレイ履歴の titleId → トロフィーセット (npCommunicationId) の対応 */
export async function fetchTrophySetIds(
    auth: AuthorizationPayload,
    titleIds: string[],
): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    for (let i = 0; i < titleIds.length; i += SPECIFIC_TITLE_CHUNK) {
        const chunk = titleIds.slice(i, i + SPECIFIC_TITLE_CHUNK);
        const res = await getUserTrophiesForSpecificTitle(auth, "me", { npTitleIds: chunk.join(","), headerOverrides: JA });
        for (const t of res.titles) {
            map.set(t.npTitleId, (t.trophyTitles ?? []).map((x) => x.npCommunicationId));
        }
        if (i + SPECIFIC_TITLE_CHUNK < titleIds.length) await delay(API_DELAY_MS);
    }
    return map;
}

// ---- Play history ----

export interface PlayedTitlesResult {
    /** プレイしたことのある全ゲーム */
    games: PlayedTitle[];
    /** YouTube などのアプリ (category: ps4_videoservice_web_app 等) の titleId。ライブラリからも除く */
    appTitleIds: Set<string>;
}

export async function fetchPlayedTitles(auth: AuthorizationPayload): Promise<PlayedTitlesResult> {
    const all: PlayedTitle[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
        const res = await getUserPlayedGames(auth, "me", { limit: PAGE_SIZE, offset });
        all.push(...res.titles);
        if (res.titles.length < PAGE_SIZE || !res.nextOffset) break;
        await delay(API_DELAY_MS);
    }
    const isApp = (t: PlayedTitle) => /app/i.test(t.category);
    return {
        games: all.filter((t) => !isApp(t)),
        appTitleIds: new Set(all.filter(isApp).map((t) => t.titleId)),
    };
}

// ---- Library ----

export async function fetchLibrary(auth: AuthorizationPayload): Promise<Omit<PsLibraryItem, "firstSeenAt">[]> {
    const items: Omit<PsLibraryItem, "firstSeenAt">[] = [];
    for (let start = 0; ; start += PAGE_SIZE) {
        const res = await getPurchasedGames(auth, { size: PAGE_SIZE, start });
        const games = res.data?.purchasedTitlesRetrieve?.games ?? [];
        for (const g of games) {
            // 体験版は購入したゲームではないので載せない
            if (/\bDEMO\b|体験版/i.test(g.name)) continue;
            // productId / entitlementId は購入の識別子なので保存しない
            items.push({
                titleId: g.titleId,
                conceptId: g.conceptId ?? undefined,
                name: g.name,
                image: g.image?.url || undefined,
                platform: g.platform,
                isPreOrder: g.isPreOrder,
                membership: g.membership,
            });
        }
        if (games.length < PAGE_SIZE) break;
        await delay(API_DELAY_MS);
    }
    return items;
}
