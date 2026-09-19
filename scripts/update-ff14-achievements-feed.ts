/**
 * FF14 Achievements フィード更新スクリプト
 *
 * Lodestone (日本版) の達成ヒストリーをスクレイピングし、ff14-achievements-feed.json に差分マージする。
 *
 * - 一覧ページ (50 件/ページ、新しい順) の各行は `<a class="entry__achievement" href=".../achievement/detail/<id>/">`
 *   そのもので、本文は「カテゴリ「名前」を達成しました。」。ここからカテゴリと名前を取る
 * - 説明文・達成ポイント・報酬は詳細ページにしか無いので、未取得のものを 1 run あたり MAX_DETAIL_PER_RUN 件ずつ埋める
 *   (初回は約 1,000 件あるので数 run かけて埋まる)
 * - アチーブメントは不変なのでキャッシュ (ff14-achievements-cache.json) は無期限。一覧は全件キャッシュ済みの
 *   ページに当たったところで止める
 *
 * GitHub Actions から定期実行される想定。
 *
 * 必要な環境変数:
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import * as cheerio from "cheerio";

import { notifyIfNoteworthy } from "./lib/discord-notification";
import { readFeed, writeFeed } from "./lib/feed-storage";

const FEED_FILE = "ff14-achievements-feed.json";
const CACHE_FILE = "ff14-achievements-cache.json";

const CHARACTER_ID = "27095571";
const LODESTONE_BASE_URL = "https://jp.finalfantasyxiv.com";
const ACHIEVEMENTS_URL = `${LODESTONE_BASE_URL}/lodestone/character/${CHARACTER_ID}/achievement/`;

const FETCH_TIMEOUT = 15000;
/** 達成ヒストリーは 2026-09 時点で 21 ページ。上限に当たったら warning を出す */
const MAX_PAGES = 40;
const MAX_RETRIES = 3;
const PAGE_DELAY_MS = 1000;
const MAX_DETAIL_PER_RUN = 150;
const DETAIL_BATCH_SIZE = 5;
const DETAIL_BATCH_DELAY_MS = 1000;

// ---- Types ----

interface FF14AchievementDetail {
    description?: string;
    points?: number;
    /** 例: { label: "称号", value: "Seeker of Eternity" } */
    reward?: { label: string; value: string };
}

interface FF14AchievementRecord {
    /** Lodestone のアチーブメント id */
    id: string;
    url: string;
    /** 一覧の本文そのまま: 「クエスト「永久の探求者」を達成しました。」 */
    text: string;
    category?: string;
    name: string;
    icon?: string;
    date: string;
    /** undefined = 詳細ページ未取得 */
    detail?: FF14AchievementDetail;
    cachedAt: string;
}

interface FF14AchievementsCache {
    version: 2;
    achievements: Record<string, FF14AchievementRecord>;
}

/** v1 のキャッシュ (URL → { date, title, cachedAt })。一覧のリンクを取り損ねていて URL が空のものしか無かった */
type LegacyCache = Record<string, { date?: string; title?: string; cachedAt?: string }>;

interface FF14AchievementFeedEntry {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: "ff14-achievement";
    description?: string;
    category?: string;
    points?: number;
    reward?: { label: string; value: string };
    thumbnail?: string;
}

interface FF14AchievementsFeedFile {
    lastUpdated: string;
    /** Lodestone 上の達成ポイント合計 */
    totalPoints?: number;
    posts: FF14AchievementFeedEntry[];
}

// ---- Helpers ----

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "ja,en;q=0.9",
                },
                signal: controller.signal,
            });
            return response;
        } catch (error) {
            clearTimeout(timer);
            if (attempt === retries) throw error;
            const backoff = 500 * Math.pow(2, attempt - 1) + Math.random() * 200;
            console.warn(`Attempt ${attempt} failed for ${url}, retrying in ${Math.round(backoff)}ms...`);
            await delay(backoff);
        } finally {
            clearTimeout(timer);
        }
    }
    throw new Error("Unreachable");
}

const DETAIL_PATH = /\/achievement\/detail\/(\d+)\//;

/** 「クエスト「永久の探求者」を達成しました。」→ { category: "クエスト", name: "永久の探求者" } */
function parseActivityText(text: string): { category?: string; name: string } {
    const m = text.match(/^(.+?)「(.+)」を達成しました。?$/);
    return m ? { category: m[1], name: m[2] } : { name: text };
}

// ---- Scraping ----

interface ListEntry {
    id: string;
    url: string;
    text: string;
    icon?: string;
    date: string;
}

async function scrapeAchievementsPage(pageUrl: string): Promise<{
    entries: ListEntry[];
    nextPageUrl: string | null;
    totalPoints?: number;
}> {
    const response = await fetchWithRetry(pageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch achievements page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const entries: ListEntry[] = [];

    $(".entry__achievement").each((_, element) => {
        const $item = $(element);
        const text = $item.find(".entry__activity__txt").text().trim();
        if (!text) return;

        // 行そのものが <a href=".../achievement/detail/<id>/"> (子孫を探すと見つからない)
        const href = $item.attr("href") ?? $item.find("a[href*='/achievement/detail/']").attr("href");
        const idMatch = href?.match(DETAIL_PATH);
        if (!href || !idMatch) {
            console.warn(`Skipping achievement without detail link: ${text}`);
            return;
        }

        const timestampMatch = $.html($item).match(/ldst_strftime\((\d+),/);
        if (!timestampMatch) {
            console.warn(`Skipping achievement without timestamp: ${text}`);
            return;
        }

        entries.push({
            id: idMatch[1],
            url: `${LODESTONE_BASE_URL}${href}`,
            text,
            icon: $item.find("img").attr("src") || undefined,
            date: new Date(parseInt(timestampMatch[1], 10) * 1000).toISOString(),
        });
    });

    let nextPageUrl: string | null = null;
    const nextHref = $(".btn__pager__next:not(.btn__pager__next--disabled)").attr("href")
        ?? $(".btn__pager__next:not(.btn__pager__next--disabled)").find("a").attr("href");
    if (nextHref && nextHref !== "javascript:void(0);") {
        nextPageUrl = nextHref.startsWith("http") ? nextHref : `${LODESTONE_BASE_URL}${nextHref}`;
    }

    const points = parseInt($(".achievement__point").first().text().trim(), 10);
    return { entries, nextPageUrl, totalPoints: Number.isFinite(points) ? points : undefined };
}

async function scrapeDetail(url: string): Promise<FF14AchievementDetail> {
    const response = await fetchWithRetry(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const $ = cheerio.load(await response.text());

    const detail: FF14AchievementDetail = {};
    const points = parseInt($(".entry__achievement__view .entry__achievement__number").first().text().trim(), 10);
    if (Number.isFinite(points)) detail.points = points;

    // .achievement__base = 説明文 (p) → [報酬の見出し (h3) → 報酬 (p)]
    const $base = $(".achievement__base").first();
    const description = $base.children("p.achievement__base--text").first().text().trim();
    if (description) detail.description = description;
    const $rewardTitle = $base.children("h3.achievement__base--title").first();
    if ($rewardTitle.length > 0) {
        const value = $rewardTitle.nextAll("p.achievement__base--text").first().text().trim();
        const label = $rewardTitle.text().trim().replace(/^報酬/, "") || "報酬";
        if (value) detail.reward = { label, value };
    }
    return detail;
}

// ---- Cache ----

async function loadCache(): Promise<FF14AchievementsCache> {
    const raw = await readFeed<FF14AchievementsCache | LegacyCache>(CACHE_FILE, { version: 2, achievements: {} });
    if ((raw as FF14AchievementsCache).version === 2) return raw as FF14AchievementsCache;

    // v1 → v2: URL キーのうち詳細ページを指すものだけ引き継ぐ (空キーの壊れたエントリは捨てて取り直す)
    const achievements: Record<string, FF14AchievementRecord> = {};
    for (const [url, entry] of Object.entries(raw as LegacyCache)) {
        const idMatch = url.match(DETAIL_PATH);
        if (!idMatch || !entry.title || !entry.date) continue;
        const { category, name } = parseActivityText(entry.title);
        achievements[idMatch[1]] = {
            id: idMatch[1],
            url,
            text: entry.title,
            category,
            name,
            date: entry.date,
            cachedAt: entry.cachedAt ?? new Date().toISOString(),
        };
    }
    console.log(`Migrated legacy cache: kept ${Object.keys(achievements).length} of ${Object.keys(raw).length} entries`);
    return { version: 2, achievements };
}

async function loadExisting(): Promise<FF14AchievementsFeedFile> {
    return readFeed<FF14AchievementsFeedFile>(FEED_FILE, { lastUpdated: "", posts: [] });
}

// ---- Main ----

async function main() {
    const errors: string[] = [];
    const warnings: string[] = [];
    const now = new Date().toISOString();

    console.log("Fetching FF14 achievements...");
    const cache = await loadCache();
    const records = cache.achievements;
    const cachedBefore = Object.keys(records).length;

    // 一覧: キャッシュ済みだけのページに当たるまで新しい順に読む
    let currentUrl: string | null = ACHIEVEMENTS_URL;
    let pageCount = 0;
    let totalPoints: number | undefined;
    let newCount = 0;

    while (currentUrl && pageCount < MAX_PAGES) {
        console.log(`Checking page ${pageCount + 1}...`);
        try {
            const page = await scrapeAchievementsPage(currentUrl);
            if (pageCount === 0) totalPoints = page.totalPoints;
            const fresh = page.entries.filter((e) => !records[e.id]);
            for (const e of fresh) {
                const { category, name } = parseActivityText(e.text);
                records[e.id] = { ...e, category, name, cachedAt: now };
            }
            // 既存レコードのアイコンが欠けていたら埋める (v1 キャッシュはアイコンを持っていなかった)
            for (const e of page.entries) {
                if (records[e.id] && !records[e.id].icon && e.icon) records[e.id].icon = e.icon;
            }
            newCount += fresh.length;
            pageCount++;

            if (fresh.length === 0) {
                console.log(`Page ${pageCount} fully cached, stopping`);
                break;
            }
            currentUrl = page.nextPageUrl;
            if (currentUrl) await delay(PAGE_DELAY_MS);
        } catch (error) {
            const msg = `Page ${pageCount + 1} scraping failed: ${error instanceof Error ? error.message : error}`;
            console.error(msg);
            errors.push(msg);
            break;
        }
    }
    if (currentUrl && pageCount >= MAX_PAGES) {
        warnings.push(`MAX_PAGES (${MAX_PAGES}) に達したため途中で止めました。MAX_PAGES を上げてください`);
    }

    // 詳細 (説明文・ポイント・報酬): 未取得のものを新しい順に上限まで
    const pendingDetails = Object.values(records)
        .filter((r) => r.detail === undefined)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
    const detailTargets = pendingDetails.slice(0, MAX_DETAIL_PER_RUN);
    let detailFailures = 0;
    if (detailTargets.length > 0) {
        console.log(`Fetching details for ${detailTargets.length} of ${pendingDetails.length} achievements...`);
        for (let i = 0; i < detailTargets.length; i += DETAIL_BATCH_SIZE) {
            const batch = detailTargets.slice(i, i + DETAIL_BATCH_SIZE);
            await Promise.all(
                batch.map(async (r) => {
                    try {
                        r.detail = await scrapeDetail(r.url);
                    } catch (error) {
                        detailFailures++;
                        console.warn(`Detail failed for ${r.id}: ${error instanceof Error ? error.message : error}`);
                    }
                }),
            );
            if (i + DETAIL_BATCH_SIZE < detailTargets.length) await delay(DETAIL_BATCH_DELAY_MS);
        }
    }
    if (detailFailures > 0) {
        warnings.push(`詳細ページの取得に ${detailFailures} 件失敗 (次回 run で再試行)`);
    }
    const remainingDetails = pendingDetails.length - (detailTargets.length - detailFailures);

    await writeFeed(CACHE_FILE, cache);

    // フィード
    const posts: FF14AchievementFeedEntry[] = Object.values(records)
        .map((r) => ({
            id: `ff14-achievement-${r.id}`,
            title: r.name,
            url: r.url,
            date: r.date,
            platform: "ff14-achievement" as const,
            description: r.detail?.description,
            category: r.category,
            points: r.detail?.points,
            reward: r.detail?.reward,
            thumbnail: r.icon,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const existing = await loadExisting();
    const output: FF14AchievementsFeedFile = {
        lastUpdated: now,
        totalPoints: totalPoints ?? existing.totalPoints,
        posts,
    };
    await writeFeed(FEED_FILE, output);
    console.log(
        `Saved ${posts.length} achievements (cache ${cachedBefore} → ${posts.length}, +${newCount} new, details remaining ${remainingDetails})`,
    );

    await notifyIfNoteworthy({
        source: "FF14 Achievements",
        status: warnings.length > 0 ? "warning" : "success",
        newItems: newCount,
        summary: warnings.join("\n") || undefined,
        metrics: [
            { name: "New Achievements", value: `+${newCount}` },
            { name: "Total Achievements", value: posts.length },
            { name: "Details Remaining", value: remainingDetails },
        ],
        errors,
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await notifyIfNoteworthy({
        source: "FF14 Achievements",
        status: "error",
        newItems: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
