/**
 * Swarm 取り込みの不変条件（2 件だけ。件数を増やさない）
 *   1. Sheet 行（IFTTT の日付文字列）と ISO payload が同じ id / 日付 / 座標に収束する。
 *      23 時台 JST が翌日に流れないことも兼ねて確認（TZ=UTC で走らせる）。
 *   2. 0 行の run は GCS を読みも書きもしない。
 *
 * 実行: npm test
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { appendCheckins, prepareCheckin, rowsToPayloads, type FeedIO } from "./checkin";

const VENUE_URL = "https://foursquare.com/v/test";
const MAP_URL = "https://ifttt.com/map_image?lng=139.7004&lat=35.6905&zoom=18";

test("Sheet 行と ISO payload が同じエントリに収束する（23:30 JST は当日のまま）", () => {
    const [fromSheet] = rowsToPayloads([
        ["April 29, 2026 at 11:30PM", "テストカフェ", VENUE_URL, MAP_URL, "テスト"],
    ]);
    const sheetResult = prepareCheckin(fromSheet, new Set(), []);
    const isoResult = prepareCheckin(
        { createdAt: "2026-04-29T14:30:00Z", venueName: "テストカフェ", checkinUrl: VENUE_URL, mapImageUrl: MAP_URL, shout: "テスト" },
        new Set(),
        [],
    );

    assert.equal(sheetResult.kind, "entry");
    assert.equal(isoResult.kind, "entry");
    if (sheetResult.kind !== "entry" || isoResult.kind !== "entry") return;

    assert.deepEqual(sheetResult.entry, isoResult.entry);
    assert.equal(sheetResult.entry.date, "2026-04-29T03:00:00.000Z");
    assert.equal(sheetResult.entry.lat, 35.691);
    assert.equal(sheetResult.entry.lng, 139.7);
    assert.match(sheetResult.entry.id, /^[0-9a-f]{12}$/);
});

test("0 行なら GCS を読みも書きもしない", async () => {
    const io: FeedIO = {
        readFeed: async () => {
            throw new Error("readFeed must not be called");
        },
        writeFeed: async () => {
            throw new Error("writeFeed must not be called");
        },
    };
    const result = await appendCheckins([], [], io);
    assert.equal(result.wrote, false);
    assert.equal(result.added.length, 0);
});
