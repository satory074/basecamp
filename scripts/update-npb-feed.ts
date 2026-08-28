/**
 * NPB (日本プロ野球) 順位表 + 全試合結果 更新スクリプト
 *
 * npb.jp 公式サイトから 2 種類のデータを取得して GCS に保存する。
 *
 *   順位表    https://npb.jp/bis/<year>/stats/std_c.html   (セ)
 *             https://npb.jp/bis/<year>/stats/std_p.html   (パ)
 *             → npb-standings.json
 *
 *   試合結果  https://npb.jp/games/<year>/schedule_MM_detail.html  (03〜11)
 *             → npb-games.json
 *
 * 試合結果はインクリメンタル: 確定した過去月は不変なので、通常実行では
 * 当月 + 前月だけ取り直し、残りは既存 JSON から引き継ぐ。初回および
 * NPB_FULL_RESCRAPE=1 のときだけ全 9 ページを取得する。
 *
 * 環境変数:
 *   GCS_BUCKET          - 未設定なら public/data/ に書く (ローカル確認用)
 *   DISCORD_WEBHOOK_URL - Discord 通知用 (オプション)
 *   DISCORD_DRY_RUN=1   - Discord に POST せず stdout に出す
 *   TARGET_SEASON       - シーズン年の上書き (例: 2025)
 *   NPB_FULL_RESCRAPE=1 - 全月を取り直す
 */

import * as cheerio from "cheerio";

import type {
    NpbGame,
    NpbGamesFile,
    NpbLeagueStandings,
    NpbRecord,
    NpbStandingsFile,
    NpbTeamStanding,
} from "../app/lib/feeds/npb";
import type { NpbLeague, NpbTeamId } from "../app/lib/npb-teams";
import { NPB_LEAGUE_LABELS, resolveTeam } from "../app/lib/npb-teams";
import { notifyIfNoteworthy } from "./lib/discord-notification";
import { readFeed, writeFeed } from "./lib/feed-storage";

const STANDINGS_FILE = "npb-standings.json";
const GAMES_FILE = "npb-games.json";

const NPB_ORIGIN = "https://npb.jp";
const FETCH_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const REQUEST_DELAY_MS = 600;

/** NPB のレギュラーシーズンは 3 月〜11 月 */
const SEASON_MONTHS = ["03", "04", "05", "06", "07", "08", "09", "10", "11"];

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const COMMON_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
};

/** cheerio 1.x に古い @types/cheerio が被さっており `CheerioAPI` が引けないため、実体から型を取る */
type CheerioRoot = ReturnType<typeof cheerio.load>;

const warnings: string[] = [];

function warn(message: string): void {
    console.warn(`[warn] ${message}`);
    warnings.push(message);
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** JST の現在時刻 (UTC 表現のまま日付部分だけ JST にずらしたもの) */
function nowJst(): Date {
    return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

function seasonYear(): number {
    const override = process.env.TARGET_SEASON;
    if (override) return Number(override);
    const jst = nowJst();
    // 1〜2 月はまだ前年シーズンの成績を見せる
    return jst.getUTCMonth() + 1 <= 2 ? jst.getUTCFullYear() - 1 : jst.getUTCFullYear();
}

async function fetchHtml(url: string): Promise<string> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
        try {
            const res = await fetch(url, { headers: COMMON_HEADERS, signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        } catch (error) {
            lastError = error;
            if (attempt < MAX_RETRIES) {
                const backoff = 500 * 2 ** (attempt - 1) + Math.random() * 300;
                console.log(`  retry ${attempt}/${MAX_RETRIES} in ${Math.round(backoff)}ms: ${url}`);
                await delay(backoff);
            }
        } finally {
            clearTimeout(timer);
        }
    }
    throw new Error(`fetch failed after ${MAX_RETRIES} attempts: ${url} (${String(lastError)})`);
}

// ---------------------------------------------------------------- 順位表

/** "27-25(1)" / "37-24" / "***" / "" → NpbRecord | null */
function parseRecord(raw: string): NpbRecord | null {
    const text = raw.replace(/[\s　]/g, "");
    if (!text || text.includes("*")) return null;
    const match = text.match(/^(\d+)-(\d+)(?:\((\d+)\))?$/);
    if (!match) {
        warn(`unparsable record cell: ${JSON.stringify(raw)}`);
        return null;
    }
    return { wins: Number(match[1]), losses: Number(match[2]), draws: Number(match[3] ?? 0) };
}

/** `table.tablefix2` の `tableIndex` 番目を解析する。0 = チーム勝敗表 / 1 = 交流戦チーム勝敗表 */
function parseStandingsTable($: CheerioRoot, tableIndex: number): NpbTeamStanding[] {
    const table = $("table.tablefix2").eq(tableIndex);
    if (table.length === 0) return [];

    const headers: string[] = $(table)
        .find("thead th")
        .map((_, th) => $(th).text().replace(/[\s　]/g, ""))
        .get();

    const rows: NpbTeamStanding[] = [];

    $(table)
        .find("tbody tr")
        .each((_, tr) => {
            const cells: string[] = $(tr)
                .find("td")
                .map((__, td) => $(td).text().trim())
                .get();
            if (cells.length === 0) return;

            const byHeader = (name: string): string => {
                const index = headers.indexOf(name);
                return index >= 0 ? (cells[index] ?? "") : "";
            };

            const team = resolveTeam(byHeader("チーム"));
            if (!team) {
                warn(`unknown team in standings row: ${JSON.stringify(cells[0])}`);
                return;
            }

            const vs: Partial<Record<NpbTeamId, NpbRecord>> = {};
            headers.forEach((header, index) => {
                if (!header.startsWith("対")) return;
                const opponent = resolveTeam(header);
                if (!opponent) {
                    warn(`unknown opponent column: ${header}`);
                    return;
                }
                const record = parseRecord(cells[index] ?? "");
                if (record) vs[opponent.id] = record;
            });

            const gamesBehindRaw = byHeader("差");

            rows.push({
                rank: 0, // 下で行順から埋める
                tied: false,
                teamId: team.id,
                games: Number(byHeader("試合")) || 0,
                wins: Number(byHeader("勝利")) || 0,
                losses: Number(byHeader("敗北")) || 0,
                draws: Number(byHeader("引分")) || 0,
                winPct: byHeader("勝率"),
                gamesBehind: !gamesBehindRaw || gamesBehindRaw.startsWith("-") ? null : gamesBehindRaw,
                home: parseRecord(byHeader("ホーム")) ?? { wins: 0, losses: 0, draws: 0 },
                road: parseRecord(byHeader("ロード")) ?? { wins: 0, losses: 0, draws: 0 },
                vs,
                interleagueRecord: parseRecord(byHeader("交流戦")),
            });
        });

    // 順位は行順。勝率が前行と同じなら同率
    rows.forEach((row, index) => {
        if (index > 0 && row.winPct === rows[index - 1].winPct) {
            row.rank = rows[index - 1].rank;
            row.tied = true;
            rows[index - 1].tied = true;
        } else {
            row.rank = index + 1;
        }
    });

    return rows;
}

interface ParsedLeague {
    standings: NpbLeagueStandings;
    asOf: string | null;
}

async function fetchLeagueStandings(year: number, league: NpbLeague): Promise<ParsedLeague> {
    const slug = league === "central" ? "std_c" : "std_p";
    const url = `${NPB_ORIGIN}/bis/${year}/stats/${slug}.html`;
    console.log(`Fetching standings: ${url}`);
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const tables = $("table.tablefix2");
    if (tables.length === 0) {
        warn(`no standings table found for ${league}`);
    }

    const asOfMatch = html.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s*現在/);
    const asOf = asOfMatch
        ? `${asOfMatch[1]}-${asOfMatch[2].padStart(2, "0")}-${asOfMatch[3].padStart(2, "0")}`
        : null;

    const teams = parseStandingsTable($, 0);
    const interleague = parseStandingsTable($, 1);

    return {
        standings: { league, label: NPB_LEAGUE_LABELS[league], teams, interleague },
        asOf,
    };
}

// ------------------------------------------------------------ 試合結果

function weekdayOf(date: string): string {
    const [y, m, d] = date.split("-").map(Number);
    return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function parseScheduleMonth(html: string, year: number, month: string): NpbGame[] {
    const $ = cheerio.load(html);
    const games: NpbGame[] = [];
    /** 対戦カードが載っている行数。0 なら「その月は公式戦なし」で異常ではない */
    let matchRows = 0;

    $("#schedule_detail table tbody tr").each((_, tr) => {
        const row = $(tr);
        const rowId = row.attr("id") ?? "";
        const dateMatch = rowId.match(/^date(\d{2})(\d{2})$/);
        if (!dateMatch) return;
        const date = `${year}-${dateMatch[1]}-${dateMatch[2]}`;

        const cells = row.find("td");
        if (cells.length < 2) return;

        const matchCell = cells.eq(0);
        const infoCell = cells.eq(1);
        const pitCell = cells.length >= 4 ? cells.eq(3) : cells.eq(cells.length - 1);

        const homeLabel = matchCell.find(".team1").first().text().trim();
        const awayLabel = matchCell.find(".team2").first().text().trim();
        // 移動日は 4 セルすべて &nbsp;、ポストシーズンは <div class="commentLong">日本シリーズ</div>。
        // どちらも対戦カードが無い正常な行なので黙って飛ばす
        if (!homeLabel && !awayLabel) return;
        matchRows += 1;

        const homeTeam = resolveTeam(homeLabel);
        const awayTeam = resolveTeam(awayLabel);
        if (!homeTeam && !awayTeam) {
            // オールスター (セ・リーグ 対 パ・リーグ) など球団同士でない試合
            console.log(`  skipping non-club fixture on ${date}: ${homeLabel} / ${awayLabel}`);
            return;
        }
        if (!homeTeam || !awayTeam) {
            warn(`unknown team on ${date}: ${homeLabel} / ${awayLabel}`);
            return;
        }

        const href = matchCell.find("a").first().attr("href") ?? null;
        const boxScoreUrl = href ? `${NPB_ORIGIN}${href}` : null;
        const place = infoCell.find(".place").first().text().replace(/[\s　]+/g, " ").trim();
        const startTime = infoCell.find(".time").first().text().trim();
        const pitchLines: string[] = pitCell
            .find(".pit")
            .map((__, div) => $(div).text().trim())
            .get()
            .filter(Boolean);

        const base = {
            date,
            weekday: weekdayOf(date),
            home: homeTeam.id,
            away: awayTeam.id,
            place,
            startTime,
        };
        const idFromUrl = href?.match(/\/scores\/(\d{4})\/(\d{4})\/([^/]+)/);
        const id = idFromUrl
            ? `${idFromUrl[1]}-${idFromUrl[2]}-${idFromUrl[3]}`
            : `${date}-${homeTeam.urlCode}-${awayTeam.urlCode}-${startTime.replace(":", "")}`;

        const cancelCell = matchCell.find(".cancel").first();
        if (cancelCell.length > 0) {
            // "中止" / "ノーゲーム" / "(予備日)" の 3 種。意味が違うので表記をそのまま持つ
            const note = cancelCell.text().trim() || "中止";
            games.push({ ...base, id, status: "cancelled", note, boxScoreUrl });
            return;
        }

        const homeScore = matchCell.find(".score1").first().text().trim();
        const awayScore = matchCell.find(".score2").first().text().trim();

        if (/^\d+$/.test(homeScore) && /^\d+$/.test(awayScore)) {
            const pitchers: { win?: string; lose?: string; save?: string } = {};
            for (const line of pitchLines) {
                const [label, name] = line.split(/[：:]/).map((s) => s.trim());
                if (!name) continue;
                if (label.startsWith("勝")) pitchers.win = name;
                else if (label.startsWith("敗")) pitchers.lose = name;
                else pitchers.save = name;
            }
            games.push({
                ...base,
                id,
                status: "final",
                homeScore: Number(homeScore),
                awayScore: Number(awayScore),
                boxScoreUrl: boxScoreUrl ?? "",
                pitchers,
            });
            return;
        }

        games.push({ ...base, id, status: "scheduled", probablePitchers: pitchLines });
    });

    if (matchRows > 0 && games.length === 0) {
        warn(`month ${month}: ${matchRows} match rows but nothing parsed`);
    }
    if (matchRows === 0) console.log(`  month ${month}: no regular-season games`);
    return games;
}

async function fetchScheduleMonth(year: number, month: string): Promise<NpbGame[]> {
    const url = `${NPB_ORIGIN}/games/${year}/schedule_${month}_detail.html`;
    console.log(`Fetching schedule: ${url}`);
    return parseScheduleMonth(await fetchHtml(url), year, month);
}

/** 取り直す月を決める。過去の確定月は不変なので触らない */
function monthsToFetch(existing: NpbGamesFile | null, sameSeason: boolean): string[] {
    if (process.env.NPB_FULL_RESCRAPE === "1" || !existing || !sameSeason) return [...SEASON_MONTHS];

    const jst = nowJst();
    const current = String(jst.getUTCMonth() + 1).padStart(2, "0");
    const previous = String(jst.getUTCMonth() || 12).padStart(2, "0");

    const wanted = new Set<string>();
    for (const month of [previous, current]) {
        if (SEASON_MONTHS.includes(month)) wanted.add(month);
    }
    // 前回失敗などで欠けている月も回収する
    for (const month of SEASON_MONTHS) {
        if (!existing.months[month]) wanted.add(month);
    }
    return [...wanted].sort();
}

// ------------------------------------------------------------------ main

async function main(): Promise<void> {
    const year = seasonYear();
    console.log(`NPB season: ${year}`);

    const previousStandings = await readFeed<NpbStandingsFile | null>(STANDINGS_FILE, null);
    const previousGames = await readFeed<NpbGamesFile | null>(GAMES_FILE, null);
    const sameSeason = previousGames?.season === year;

    // ---- 順位表 ----
    const central = await fetchLeagueStandings(year, "central");
    await delay(REQUEST_DELAY_MS);
    const pacific = await fetchLeagueStandings(year, "pacific");

    const leagues = [central.standings, pacific.standings];
    const scrapedRows = leagues.reduce((sum, l) => sum + l.teams.length, 0);

    let standings: NpbStandingsFile;
    if (scrapedRows === 0 && previousStandings) {
        // オフシーズンや公開前は表が空になる。既存データを保持して lastUpdated だけ更新
        warn("standings tables were empty; keeping previous standings");
        standings = { ...previousStandings, lastUpdated: new Date().toISOString() };
    } else {
        standings = {
            season: year,
            asOf: central.asOf ?? pacific.asOf,
            lastUpdated: new Date().toISOString(),
            leagues,
        };
    }

    for (const league of standings.leagues) {
        const wins = league.teams.reduce((s, t) => s + t.wins, 0);
        const losses = league.teams.reduce((s, t) => s + t.losses, 0);
        console.log(`  ${league.label}: ${league.teams.length} teams, W${wins} / L${losses}`);
    }

    // ---- 試合結果 ----
    const months: Record<string, NpbGame[]> = sameSeason ? { ...(previousGames?.months ?? {}) } : {};
    const targets = monthsToFetch(previousGames, sameSeason);
    console.log(`Fetching ${targets.length} schedule page(s): ${targets.join(", ")}`);

    for (const month of targets) {
        months[month] = await fetchScheduleMonth(year, month);
        await delay(REQUEST_DELAY_MS);
    }

    const allGames = Object.values(months).flat();
    const counts = { final: 0, cancelled: 0, scheduled: 0 };
    for (const game of allGames) counts[game.status] += 1;
    console.log(
        `  games: ${allGames.length} total (final ${counts.final} / cancelled ${counts.cancelled} / scheduled ${counts.scheduled})`,
    );

    const previousFinalIds = new Set(
        Object.values(previousGames?.months ?? {})
            .flat()
            .filter((g) => g.status === "final")
            .map((g) => g.id),
    );
    const newFinals = allGames.filter((g) => g.status === "final" && !previousFinalIds.has(g.id)).length;

    const gamesFile: NpbGamesFile = { season: year, lastUpdated: new Date().toISOString(), months };

    await writeFeed(STANDINGS_FILE, standings);
    await writeFeed(GAMES_FILE, gamesFile);
    console.log(`Wrote ${STANDINGS_FILE} and ${GAMES_FILE}`);

    const leaders = standings.leagues
        .map((l) => {
            const top = l.teams[0];
            return top ? `${l.label.slice(0, 1)}: ${resolveTeam(top.teamId)?.shortName ?? top.teamId}` : null;
        })
        .filter(Boolean)
        .join(" / ");

    await notifyIfNoteworthy({
        source: "NPB Feed",
        status: warnings.length > 0 ? "warning" : "success",
        newItems: newFinals,
        summary: `${year}年シーズン ${leaders}`,
        metrics: [
            { name: "新規確定試合", value: newFinals },
            { name: "全試合", value: allGames.length },
            { name: "データ日付", value: standings.asOf ?? "-" },
            { name: "取得ページ", value: targets.length + 2 },
        ],
        errors: warnings.slice(0, 10),
    });
}

main().catch(async (error: unknown) => {
    console.error("NPB feed update failed:", error);
    await notifyIfNoteworthy({
        source: "NPB Feed",
        status: "error",
        newItems: 0,
        summary: "NPB フィードの更新に失敗しました",
        errors: [String(error)],
    });
    process.exitCode = 1;
});
