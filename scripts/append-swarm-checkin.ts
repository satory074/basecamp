/**
 * Swarm Checkin 追記スクリプト（手動 payload 注入 / migrate_only 用）
 *
 * 通常運用は scripts/sync-swarm-sheet.ts（cron、IFTTT Free → Google Sheets inbox）に移った。
 * こちらは workflow_dispatch で payload を注入する動作確認と、既存エントリの一括正規化のために残している。
 * 変換ロジックは scripts/lib/swarm/checkin.ts に集約してあり、2 経路で結果が食い違わない。
 *
 * 必要な環境変数:
 *   SWARM_PAYLOAD            - JSON.stringify(client_payload)
 *   SWARM_BLOCKED_VENUES     - JSON 配列（ユーザー定義 blocklist）
 *   SWARM_MIGRATE_ONLY       - "1" なら payload を読まず既存エントリの正規化だけ実行
 *   DISCORD_WEBHOOK_URL      - 通知用（オプション）
 */

import { notifyIfNoteworthy } from "./lib/discord-notification";
import { writeFeed } from "./lib/feed-storage";
import {
    FEED_FILE,
    appendCheckins,
    loadExisting,
    normalizeExisting,
    notifySwarmResult,
    parseUserBlocklist,
    sortByDateDesc,
    type IftttPayload,
} from "./lib/swarm/checkin";

function parsePayload(): IftttPayload {
    const raw = process.env.SWARM_PAYLOAD;
    if (!raw) throw new Error("SWARM_PAYLOAD is not set");
    try {
        return JSON.parse(raw) as IftttPayload;
    } catch (err) {
        throw new Error(`Invalid SWARM_PAYLOAD JSON: ${(err as Error).message}`);
    }
}

/** 既存 JSON を正規化して書き戻すだけのモード（新規エントリなし） */
async function migrateOnly() {
    const existing = await loadExisting();
    const merged = sortByDateDesc(normalizeExisting(existing.checkins));
    await writeFeed(FEED_FILE, { lastUpdated: new Date().toISOString(), checkins: merged });
    console.log(`Normalized ${merged.length} checkins (dates coarsened to JST calendar day)`);
}

async function main() {
    if (process.env.SWARM_MIGRATE_ONLY === "1") {
        await migrateOnly();
        return;
    }
    const result = await appendCheckins([parsePayload()], parseUserBlocklist());
    await notifySwarmResult(result);
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
