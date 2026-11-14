import { test } from "node:test";
import assert from "node:assert/strict";
import { collapseRuns, expandRows } from "./collapse";
import { jstDayKey } from "../shared/date-utils";

// 不変条件 1: 畳んでも投稿は 1 件も消えず、重複せず、順番も変わらない
test("collapseRuns は全件を同じ順でちょうど 1 回ずつ保持する", () => {
    const platforms = ["a", "a", "a", "b", "a", "a", "c", "c", "c", "c", "b"];
    const items = platforms.map((platform, i) => ({ id: String(i), platform }));

    const rows = collapseRuns(items, 3);

    assert.deepEqual(expandRows(rows), items);
    // 3 件以上の連続 (a×3, c×4) だけが畳まれている
    assert.deepEqual(
        rows.map((r) => (r.kind === "run" ? `${r.platform}+${r.rest.length}` : r.item.platform)),
        ["a+2", "b", "a", "a", "c+3", "b"],
    );
});

// 不変条件 2: 日付の区切りは実行環境の TZ ではなく JST で決まる (ビルドは UTC で走る)
test("jstDayKey は UTC 15:30 を JST の翌日として扱う", () => {
    assert.equal(jstDayKey("2026-11-13T15:30:00Z"), "2026-11-14");
});
