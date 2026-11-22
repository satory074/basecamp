// 一時的な診断用 (main には入れない)。GitHub Actions の runner からブクログが何を返すかを見る。
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const SHELF = "https://booklog.jp/users/satory074?category_id=all&status=all&display=image";
const SCRIPT_HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ja,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Referer": "https://booklog.jp/",
};

const cases = [
    ["shelf p1 / script headers + cache buster", `${SHELF}&page=1&_=${Date.now()}`, SCRIPT_HEADERS],
    ["shelf p1 / UA only", `${SHELF}&page=1`, { "User-Agent": UA }],
    ["shelf p1 / no headers", `${SHELF}&page=1`, {}],
    ["shelf p1 / UA + Accept-Language, no cache headers", `${SHELF}&page=1`, { "User-Agent": UA, "Accept-Language": "ja,en;q=0.9" }],
    ["shelf p6 / script headers", `${SHELF}&page=6&_=${Date.now()}`, SCRIPT_HEADERS],
    ["shelf default view", "https://booklog.jp/users/satory074", { "User-Agent": UA }],
    ["RSS", "https://booklog.jp/users/satory074/feed", { "User-Agent": UA }],
    ["archive page", "https://booklog.jp/users/satory074/archives/1/4065441285", { "User-Agent": UA }],
    ["item page", "https://booklog.jp/item/1/4065441285", { "User-Agent": UA }],
];

for (const [label, url, headers] of cases) {
    try {
        const r = await fetch(url, { headers, redirect: "manual" });
        const t = await r.text();
        const h = (k) => r.headers.get(k) ?? "-";
        const title = (t.match(/<title>([^<]*)/i) || [])[1]?.trim() ?? "-";
        const text = t.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
        console.log(`=== ${label}`);
        console.log(`status=${r.status} pop=${h("x-amz-cf-pop")} x-cache=${h("x-cache")} server=${h("server")} type=${h("content-type")} location=${h("location")}`);
        console.log(`len=${t.length} item-init=${(t.match(/shelf-item item-init/g) || []).length} data-book=${(t.match(/data-book=/g) || []).length} rank-icon=${(t.match(/rank-icon/g) || []).length}`);
        console.log(`title=${title}`);
        console.log(`text=${text}`);
    } catch (e) {
        console.log(`=== ${label}\nERROR ${e instanceof Error ? `${e.name}: ${e.message} ${e.cause ?? ""}` : e}`);
    }
}
