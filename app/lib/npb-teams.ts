/**
 * NPB 12 球団のレジストリ。
 *
 * NPB 公式サイトはページごとに違う表記でチームを指すため、1 つの `NpbTeamId` に
 * 4 系統のエイリアスをまとめて持たせ、`resolveTeam()` でどれからでも引けるようにする。
 *
 *   - `fullName`  順位表 (std_c.html / std_p.html) の「チーム」列    例: 阪神タイガース
 *   - `shortName` 日程詳細 (schedule_MM_detail.html) の team1/team2  例: 阪神
 *   - `vsLabel`   順位表の対戦成績列見出し「対○」の ○               例: 神
 *   - `urlCode`   ボックススコア URL のチームコード                  例: t
 *
 * スクレイパ (scripts/update-npb-feed.ts) とページの両方から import される
 * single source of truth。
 */

export type NpbLeague = "central" | "pacific";

export type NpbTeamId =
    | "tigers"
    | "giants"
    | "baystars"
    | "swallows"
    | "dragons"
    | "carp"
    | "hawks"
    | "lions"
    | "fighters"
    | "buffaloes"
    | "marines"
    | "eagles";

export interface NpbTeam {
    id: NpbTeamId;
    league: NpbLeague;
    /** 順位表の「チーム」列に出る正式名 */
    fullName: string;
    /** 日程詳細の team1 / team2 に出る略称 */
    shortName: string;
    /** 順位表の対戦成績列見出し「対○」の ○ 一文字 */
    vsLabel: string;
    /** ボックススコア URL のチームコード */
    urlCode: string;
    /** globals.css の CSS 変数名 (--color-npb-<key>) */
    colorKey: string;
}

export const NPB_LEAGUE_LABELS: Record<NpbLeague, string> = {
    central: "セントラル・リーグ",
    pacific: "パシフィック・リーグ",
};

export const NPB_TEAMS: readonly NpbTeam[] = [
    { id: "tigers",    league: "central", fullName: "阪神タイガース",               shortName: "阪神",         vsLabel: "神", urlCode: "t",  colorKey: "tigers" },
    { id: "giants",    league: "central", fullName: "読売ジャイアンツ",             shortName: "巨人",         vsLabel: "巨", urlCode: "g",  colorKey: "giants" },
    { id: "baystars",  league: "central", fullName: "横浜DeNAベイスターズ",         shortName: "DeNA",         vsLabel: "デ", urlCode: "db", colorKey: "baystars" },
    { id: "swallows",  league: "central", fullName: "東京ヤクルトスワローズ",       shortName: "ヤクルト",     vsLabel: "ヤ", urlCode: "s",  colorKey: "swallows" },
    { id: "dragons",   league: "central", fullName: "中日ドラゴンズ",               shortName: "中日",         vsLabel: "中", urlCode: "d",  colorKey: "dragons" },
    { id: "carp",      league: "central", fullName: "広島東洋カープ",               shortName: "広島",         vsLabel: "広", urlCode: "c",  colorKey: "carp" },
    { id: "hawks",     league: "pacific", fullName: "福岡ソフトバンクホークス",     shortName: "ソフトバンク", vsLabel: "ソ", urlCode: "h",  colorKey: "hawks" },
    { id: "lions",     league: "pacific", fullName: "埼玉西武ライオンズ",           shortName: "西武",         vsLabel: "西", urlCode: "l",  colorKey: "lions" },
    { id: "fighters",  league: "pacific", fullName: "北海道日本ハムファイターズ",   shortName: "日本ハム",     vsLabel: "日", urlCode: "f",  colorKey: "fighters" },
    { id: "buffaloes", league: "pacific", fullName: "オリックス・バファローズ",     shortName: "オリックス",   vsLabel: "オ", urlCode: "b",  colorKey: "buffaloes" },
    { id: "marines",   league: "pacific", fullName: "千葉ロッテマリーンズ",         shortName: "ロッテ",       vsLabel: "ロ", urlCode: "m",  colorKey: "marines" },
    { id: "eagles",    league: "pacific", fullName: "東北楽天ゴールデンイーグルス", shortName: "楽天",         vsLabel: "楽", urlCode: "e",  colorKey: "eagles" },
];

const BY_ID = new Map<string, NpbTeam>(NPB_TEAMS.map((t) => [t.id, t]));

/** 4 系統のエイリアスすべてを 1 つの索引に畳み込む */
const ALIAS_INDEX: Map<string, NpbTeam> = (() => {
    const index = new Map<string, NpbTeam>();
    for (const team of NPB_TEAMS) {
        for (const alias of [team.id, team.fullName, team.shortName, team.vsLabel, team.urlCode]) {
            index.set(normalize(alias), team);
        }
        // 順位表の見出しは「対神」の形で来る
        index.set(normalize(`対${team.vsLabel}`), team);
    }
    return index;
})();

/** 全角スペース・空白除去 + 小文字化。NPB は「横　浜」のように全角スペースを挟むことがある */
function normalize(value: string): string {
    return value.replace(/[\s　]/g, "").toLowerCase();
}

/** 正式名 / 略称 / 対○ / URL コード / id のいずれからでもチームを引く。未知なら null */
export function resolveTeam(alias: string): NpbTeam | null {
    return ALIAS_INDEX.get(normalize(alias)) ?? null;
}

export function getTeam(id: NpbTeamId): NpbTeam {
    const team = BY_ID.get(id);
    if (!team) throw new Error(`unknown NpbTeamId: ${id}`);
    return team;
}

export function teamsOf(league: NpbLeague): readonly NpbTeam[] {
    return NPB_TEAMS.filter((t) => t.league === league);
}

/** globals.css の球団カラー変数。背景色ではなく左ボーダー / ドットにのみ使うこと */
export function teamColorVar(id: NpbTeamId): string {
    return `var(--color-npb-${getTeam(id).colorKey})`;
}
