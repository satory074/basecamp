/**
 * ブクログ取り込みの不変条件（2 件だけ。件数を増やさない）
 *   1. 本棚 HTML の評価 (`rank`) が落ちない: "5" → ★5、"0" → 評価なし。
 *      フィクスチャは実際の本棚ページと同じ形 (シングルクォートの属性に &quot; で JSON)。
 *   2. 本棚が 0 冊のときはフィードを書き換えない (lastUpdated を進めない)。
 *      2026-10-07〜11-22 は 0 冊のまま lastUpdated だけ進み、止まっていることに気づけなかった。
 *
 * 実行: npm test
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { decideWrite, parseShelfHtml } from "./shelf";

function shelfItem(book: Record<string, unknown>): string {
    const attr = JSON.stringify(book).replace(/"/g, "&quot;");
    return `<div class="item-wrapper shelf-item item-init" id="book_${book.book_id}"\n        data-page="1"\n        data-book='${attr}'>\n<div class="item-area"></div></div>`;
}

test("本棚の評価が落ちない（rank 5 は ★5、0 は評価なし）", () => {
    const html = `<div id="front" class="shelf-inner">
        <div class="item-wrapper shelf-item item-placeholder"></div>
        ${shelfItem({ book_id: "1", service_id: "1", id: "4065441285", rank: "5", status_name: "読み終わった", read_at: "2026-10-21 00:00:00", create_on: "2026-10-21 08:29:16", title: "殺し屋の出世術", image: "http://image.st-booklog.jp/a.jpg", category_name: false, tags: [] })}
        ${shelfItem({ book_id: "2", service_id: "1", id: "477415654X", rank: "0", status_name: "読みたい", read_at: null, create_on: "2026-11-05 18:30:30", title: "コーディングを支える技術", category_name: false, tags: [] })}
    </div>`;

    const items = parseShelfHtml(html);

    assert.equal(items.length, 2);
    assert.equal(items[0].rating, 5);
    assert.equal(items[0].status, "読み終わった");
    assert.equal(items[0].thumbnail, "https://image.st-booklog.jp/a.jpg");
    assert.equal(items[1].rating, undefined);
    assert.equal(items[1].id, "477415654X");
});

test("本棚が 0 冊ならフィードを書き換えない", () => {
    assert.equal(decideWrite(0, 665).write, false);
    assert.equal(decideWrite(0, 0).write, false);
    assert.equal(decideWrite(665, 665).write, true);
});
