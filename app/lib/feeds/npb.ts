/**
 * NPB 順位表 / 試合結果のビルド時読み取り。
 *
 * データは `scripts/update-npb-feed.ts` が GCS に書き込む 2 ファイル:
 *   - npb-standings.json  順位表 (毎日変わる、~12KB)
 *   - npb-games.json      シーズン全試合 (過去分は不変、~200KB)
 *
 * 分けてあるのは、トップページ (/baseball) が順位表だけで描けるようにするため。
 * 月別ページだけが games を読む。
 *
 * `readFeedJson()` は取得失敗時に throw するので、他の feeds/*.ts と同じく
 * try/catch で握って null を返す (初回ビルド時にまだ JSON が無いケース)。
 */

import { readFeedJson } from "../feed-storage";
import type { NpbLeague, NpbTeamId } from "../npb-teams";

const STANDINGS_FILE = "npb-standings.json";
const GAMES_FILE = "npb-games.json";

/** 勝-敗(分) の 1 組。NPB は "27-25(1)" の形で表記する */
export interface NpbRecord {
    wins: number;
    losses: number;
    draws: number;
}

export interface NpbTeamStanding {
    /** 行順から導出。同率は同じ値 */
    rank: number;
    tied: boolean;
    teamId: NpbTeamId;
    games: number;
    wins: number;
    losses: number;
    draws: number;
    /** ".566" — NPB 表記のまま。数値化して再フォーマットすると "0.566" に化ける */
    winPct: string;
    /** 首位の "--" は null */
    gamesBehind: string | null;
    home: NpbRecord;
    road: NpbRecord;
    /** 対戦成績。自チーム ("***") はキーごと落とす */
    vs: Partial<Record<NpbTeamId, NpbRecord>>;
    /** 交流戦通算。交流戦表そのものには無い列なので通常表からのみ入る */
    interleagueRecord: NpbRecord | null;
}

export interface NpbLeagueStandings {
    league: NpbLeague;
    label: string;
    /** チーム勝敗表 */
    teams: NpbTeamStanding[];
    /** 交流戦チーム勝敗表。gamesBehind は常に null */
    interleague: NpbTeamStanding[];
}

export interface NpbStandingsFile {
    season: number;
    /** NPB 側の「◯年◯月◯日 現在」 = データそのものの日付 */
    asOf: string | null;
    /** こちらがスクレイプした時刻 */
    lastUpdated: string;
    leagues: NpbLeagueStandings[];
}

export type NpbGameStatus = "final" | "cancelled" | "scheduled";

interface NpbGameBase {
    id: string;
    /** YYYY-MM-DD */
    date: string;
    weekday: string;
    /** team1 = 主催 (ホーム) */
    home: NpbTeamId;
    away: NpbTeamId;
    place: string;
    startTime: string;
}

export interface NpbFinalGame extends NpbGameBase {
    status: "final";
    homeScore: number;
    awayScore: number;
    boxScoreUrl: string;
    pitchers: { win?: string; lose?: string; save?: string };
}

export interface NpbCancelledGame extends NpbGameBase {
    status: "cancelled";
    /** NPB 側の表記そのまま: "中止" / "ノーゲーム" / "(予備日)" */
    note: string;
    boxScoreUrl: string | null;
}

export interface NpbScheduledGame extends NpbGameBase {
    status: "scheduled";
    probablePitchers: string[];
}

export type NpbGame = NpbFinalGame | NpbCancelledGame | NpbScheduledGame;

export interface NpbGamesFile {
    season: number;
    lastUpdated: string;
    /** "03".."11" → その月の全試合 (日付昇順) */
    months: Record<string, NpbGame[]>;
}

export async function getNpbStandings(): Promise<NpbStandingsFile | null> {
    try {
        return await readFeedJson<NpbStandingsFile>(STANDINGS_FILE);
    } catch {
        return null;
    }
}

export async function getNpbGames(): Promise<NpbGamesFile | null> {
    try {
        return await readFeedJson<NpbGamesFile>(GAMES_FILE);
    } catch {
        return null;
    }
}

/**
 * 試合のある月キーを昇順で返す。ナビとサブページの generateStaticParams が共有する。
 * 11 月は日本シリーズだけで公式戦が無く空配列になるので、空の月はナビにもページにも出さない。
 */
export function monthKeys(games: NpbGamesFile | null): string[] {
    if (!games) return [];
    return Object.entries(games.months)
        .filter(([, list]) => list.length > 0)
        .map(([month]) => month)
        .sort();
}

/** 全月をフラットにして日付降順。直近 N 日分の切り出しに使う */
export function flattenGames(games: NpbGamesFile | null): NpbGame[] {
    if (!games) return [];
    return Object.values(games.months)
        .flat()
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/**
 * 直近 `days` 日ぶんの試合結果。
 *
 * 「実際に試合が行われた日」= final を 1 つ以上含む日、を基準に日付を選ぶ。
 * status !== "scheduled" で選ぶと、9〜10 月に置かれている `(予備日)` の
 * cancelled 行が 8 月の実試合より新しい日付を持つため、そちらを拾ってしまう。
 * 日付が決まったら、その日の中止試合も一緒に見せる。
 */
export function recentGames(games: NpbGamesFile | null, days: number): NpbGame[] {
    const all = flattenGames(games);
    const dates: string[] = [];
    for (const game of all) {
        if (game.status !== "final") continue;
        if (!dates.includes(game.date)) dates.push(game.date);
        if (dates.length >= days) break;
    }
    return all.filter((g) => g.status !== "scheduled" && dates.includes(g.date));
}
