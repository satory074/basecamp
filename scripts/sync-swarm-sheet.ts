/**
 * Swarm チェックイン同期（IFTTT Free → Google Sheets inbox → GCS）
 *
 * IFTTT Free プランには Webhooks action が無いので、無料の Google Sheets action で非公開 Sheet に
 * 1 チェックイン 1 行を追記してもらい、このスクリプトが cron（3 時間ごと）で排出する。
 *
 * Sheet の列順（IFTTT applet の Formatted row と一致させる。1 行目はヘッダ）:
 *   A CheckinDate | B VenueName | C VenueUrl | D VenueMapImageUrl | E Shout
 *
 * 処理順は「GCS に書く → Sheet の行を消す」。削除に失敗しても次回に同じ行が再取り込みされて
 * 重複（id に -2 サフィックス）になるだけで、`swarm-blocklist.ts redact` で消せる。
 * 逆順だと GCS 書き込み失敗時にチェックインが失われ、Foursquare API が使えないので復旧できない。
 *
 * 必要な環境変数:
 *   SWARM_SHEET_ID        - スプレッドシート ID（/spreadsheets/d/<ID>/edit の <ID>）
 *   SWARM_BLOCKED_VENUES  - JSON 配列（ユーザー定義 blocklist、省略可）
 *   SWARM_SHEET_DRY_RUN   - "1" なら GCS に書かず Sheet の行も消さない（読み取りと変換だけログに出す）
 *   DISCORD_WEBHOOK_URL   - 通知用（オプション）
 */

import { notifyIfNoteworthy } from "./lib/discord-notification";
import { readFeed } from "./lib/feed-storage";
import {
    appendCheckins,
    notifySwarmResult,
    parseUserBlocklist,
    rowsToPayloads,
    type FeedIO,
} from "./lib/swarm/checkin";
import { createSheetsClient } from "./lib/swarm/sheets";

// シート名を付けないので先頭タブが対象になる
const DATA_RANGE = "A2:E";

async function main() {
    const spreadsheetId = process.env.SWARM_SHEET_ID;
    if (!spreadsheetId) throw new Error("SWARM_SHEET_ID is not set");
    const dryRun = process.env.SWARM_SHEET_DRY_RUN === "1";

    const sheets = await createSheetsClient();
    // gid は先に取る。ここで失敗すれば GCS に触る前に止まる
    const sheetId = await sheets.getFirstSheetId(spreadsheetId);
    const rows = await sheets.readRows(spreadsheetId, DATA_RANGE);
    if (rows.length === 0) {
        console.log("No rows in sheet, nothing to do");
        return;
    }
    const payloads = rowsToPayloads(rows);
    console.log(`Read ${rows.length} row(s) from sheet (${payloads.length} non-empty)`);

    const io: FeedIO | undefined = dryRun
        ? {
              readFeed,
              writeFeed: async (filename, data) => {
                  const count = (data as { checkins?: unknown[] }).checkins?.length ?? 0;
                  console.log(`[DRY_RUN] Would write ${filename} (${count} checkins)`);
              },
          }
        : undefined;
    const result = await appendCheckins(payloads, parseUserBlocklist(), io);

    if (dryRun) {
        console.log(`[DRY_RUN] added=${result.added.length} skipped=${result.skipped.length}; sheet rows kept`);
        return;
    }

    let rowsDeleted: number | undefined;
    const errors: string[] = [];
    try {
        await sheets.deleteRows(spreadsheetId, sheetId, rows.length);
        rowsDeleted = rows.length;
        console.log(`Deleted ${rows.length} row(s) from sheet`);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Sheet row deletion failed (rows will be re-ingested next run): ${msg}`);
        console.error(errors[errors.length - 1]);
    }

    await notifySwarmResult(result, { rowsDeleted, errors });
    if (errors.length > 0) process.exit(1);
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await notifyIfNoteworthy({
        source: "Swarm",
        status: "error",
        newItems: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
