import { test } from "node:test";
import assert from "node:assert/strict";
import { DECK_SECTIONS, DECKS_AS_OF } from "./decks";
import { NAV_GROUPS } from "./navigation";

const items = DECK_SECTIONS.flatMap((s) => s.categories.flatMap((c) => c.items));

// 不変条件 1: 道具の id はページ全体で重複しない (React の key と、将来の #アンカー)
test("道具の id は重複しない", () => {
    const ids = items.map((i) => i.id);
    assert.deepEqual(ids.filter((id, n) => ids.indexOf(id) !== n), []);
});

// 不変条件 2: 外部リンクは https だけ (混在コンテンツ・typo の javascript: などを防ぐ)
test("公式ページの url はすべて https://", () => {
    const bad = items.filter((i) => i.url !== undefined && !i.url.startsWith("https://"));
    assert.deepEqual(bad.map((i) => i.id), []);
});

// 不変条件 3: サイト内リンクはナビの台帳にある実在のページだけを指す (リンク切れを作らない)
test("related.href はナビの台帳にあるパス", () => {
    const paths = new Set(NAV_GROUPS.flatMap((g) => g.entries.map((e) => e.path)));
    const bad = items.filter((i) => i.related && !paths.has(i.related.href));
    assert.deepEqual(bad.map((i) => `${i.id} → ${i.related?.href}`), []);
});

// 不変条件 4: 「◯年◯月時点」は YYYY-MM で、未来の月ではない
test("DECKS_AS_OF は YYYY-MM で未来ではない", () => {
    assert.match(DECKS_AS_OF, /^\d{4}-(0[1-9]|1[0-2])$/);
    const now = new Date();
    const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    assert.ok(DECKS_AS_OF <= thisMonth, `${DECKS_AS_OF} は ${thisMonth} より未来`);
});
