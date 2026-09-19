/**
 * PlayStation フィード (GCS) の型定義。
 *
 * GitHub Actions スクリプト (`scripts/update-playstation-feed.ts`) と
 * サイト側 (`app/lib/feeds/playstation.ts`, `/playstation`) の両方から import されるので、
 * ここには型と純粋関数だけを置く (fs / fetch / Next 依存を持ち込まない)。
 *
 * ファイルは 3 つ:
 *   - playstation-trophies.json … 獲得済みトロフィー 1 個 = 1 エントリ (追記型)
 *   - playstation-profile.json  … トロフィーレベル / ゲーム別プレイ時間 / トロフィー進捗 / 購入ライブラリのスナップショット
 *   - playstation-plays.json    … 累計プレイ時間の差分から作る「1 日 1 ゲーム 1 件」のプレイ記録
 */

export type TrophyType = "bronze" | "silver" | "gold" | "platinum";

export interface TrophyCounts {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
}

// ---- playstation-trophies.json ----

export interface PsTrophyEntry {
    /** `playstation-<npCommunicationId>-<trophyId>` */
    id: string;
    npCommunicationId: string;
    gameName: string;
    title: string;
    /** トロフィーの説明文 (ja-JP) */
    detail?: string;
    icon: string;
    trophyType: string;
    /** 全プレイヤー中の獲得率 (%) の文字列。例 "12.3" */
    earnedRate?: string;
    /** DLC グループ名。本編 (default グループ) のトロフィーには付かない */
    groupName?: string;
    /** "PS5" / "PS4" / "PS3,PS4" など */
    platform?: string;
    /** プレイ履歴側の concept id (同じゲームの PS4 版と PS5 版を束ねる id)。対応が取れないときは無し */
    conceptId?: string;
    date: string;
}

export interface PsTrophiesFile {
    accountId: string;
    lastUpdated: string;
    /** トロフィー名・説明文の言語。"ja-JP" でなければ次回 run で全タイトルを取り直す */
    locale?: string;
    trophies: PsTrophyEntry[];
}

// ---- playstation-profile.json ----

export interface PsProfile {
    onlineId: string;
    avatarUrl?: string;
    profileUrl: string;
}

export interface PsTrophySummary {
    level: number;
    /** 次のレベルまでの進捗 (0-100) */
    progress: number;
    /** 1-10。1-3 ブロンズ / 4-6 シルバー / 7-9 ゴールド / 10 プラチナ */
    tier: number;
    points?: number;
    levelBasePoints?: number;
    levelNextPoints?: number;
    earned: TrophyCounts;
}

export interface PsTrophyGroup {
    id: string;
    name: string;
    icon?: string;
    progress: number;
    earned: TrophyCounts;
    defined: TrophyCounts;
}

export interface PsTrophySet {
    npCommunicationId: string;
    npServiceName: "trophy" | "trophy2";
    name: string;
    platform: string;
    icon: string;
    progress: number;
    earned: TrophyCounts;
    defined: TrophyCounts;
    /** PSN の lastUpdatedDateTime。これが変わったタイトルだけトロフィーを取り直す */
    lastUpdated: string;
    /** DLC を持つタイトルのみ 2 件以上 */
    groups: PsTrophyGroup[];
}

/** 1 つの titleId (= 機種ごとの版) のプレイ実績 */
export interface PsGameTitle {
    titleId: string;
    platform: string;
    seconds: number;
    playCount: number;
    firstPlayed: string;
    lastPlayed: string;
}

/** concept (PS4 版と PS5 版をまとめた 1 本のゲーム) 単位のプレイ実績 */
export interface PsGame {
    conceptId: string;
    name: string;
    platforms: string[];
    seconds: number;
    playCount: number;
    firstPlayed: string;
    lastPlayed: string;
    /** 正方形アイコン */
    icon?: string;
    /** 16:9 のキービジュアル */
    hero?: string;
    /** 2:3 の縦長バナー */
    portrait?: string;
    titles: PsGameTitle[];
    trophySetIds: string[];
}

export interface PsLibraryItem {
    titleId: string;
    conceptId?: string;
    name: string;
    image?: string;
    platform: string;
    isPreOrder: boolean;
    /** "NONE" / "PS_PLUS" など */
    membership: string;
    /** ライブラリで初めて見えた時刻。初回実行時点で既にあったものは null (購入日は API から取れない) */
    firstSeenAt: string | null;
}

export interface PsLevelEvent {
    level: number;
    /** 初回実行時のベースラインは null */
    reachedAt: string | null;
}

export interface PsProfileFile {
    lastUpdated: string;
    profile: PsProfile;
    summary: PsTrophySummary;
    games: PsGame[];
    trophySets: PsTrophySet[];
    library: PsLibraryItem[];
    levelHistory: PsLevelEvent[];
}

// ---- playstation-plays.json ----

export interface PsPlayBaselineTitle {
    seconds: number;
    playCount: number;
    lastPlayed: string;
}

export interface PsPlayDay {
    /** `psplay-<dayKey>-<conceptId>` */
    id: string;
    /** JST の YYYY-MM-DD */
    dayKey: string;
    conceptId: string;
    titleId: string;
    name: string;
    icon?: string;
    platform: string;
    /** その日に増えたプレイ秒数 */
    seconds: number;
    /** その日に増えた起動回数 */
    sessions: number;
    /** その日の最後のプレイ時刻 */
    lastAt: string;
    /** 記録時点の累計プレイ秒数 (全機種合計) */
    totalSecondsAfter: number;
    /** このゲームを初めて遊んだ日 */
    isFirst?: boolean;
}

export interface PsPlaysFile {
    lastUpdated: string;
    /** 記録を始めた時刻 (最初のベースラインを取った run)。これより前の日は「記録なし」であって「遊んでいない」ではない */
    since: string | null;
    /** 前回 run 時点の titleId ごとの累計値。次の run はこれとの差分でプレイ時間を出す */
    baseline: {
        capturedAt: string | null;
        titles: Record<string, PsPlayBaselineTitle>;
    };
    /** 新しい順 */
    days: PsPlayDay[];
}

// ---- 純粋関数 ----

export type TierMaterial = "bronze" | "silver" | "gold" | "platinum";

/** トロフィーレベルのティア (1-10) → 表示素材。PS5 のレベル表示と同じ区切り */
export function tierMaterial(tier: number): TierMaterial {
    if (tier >= 10) return "platinum";
    if (tier >= 7) return "gold";
    if (tier >= 4) return "silver";
    return "bronze";
}

/** titleId の接頭辞から機種を推定する (PPSA=PS5, CUSA=PS4) */
export function platformFromTitleId(titleId: string): string {
    if (titleId.startsWith("PPSA")) return "PS5";
    if (titleId.startsWith("CUSA")) return "PS4";
    return "PS";
}

/** image.api.playstation.com の画像は `?w=` でリサイズ版を返す (他ホストはそのまま) */
export function psImage(url: string | undefined, width: number): string | undefined {
    if (!url) return undefined;
    if (!url.startsWith("https://image.api.playstation.com/")) return url;
    return `${url}${url.includes("?") ? "&" : "?"}w=${width}`;
}

/** /playstation のゲームカードのアンカー id。ホームフィードのカードはここにリンクする */
export function gameAnchor(conceptId: string): string {
    return `game-${conceptId}`;
}

export function totalTrophies(c: TrophyCounts): number {
    return c.bronze + c.silver + c.gold + c.platinum;
}
