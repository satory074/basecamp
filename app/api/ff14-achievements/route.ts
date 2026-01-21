import { NextResponse, NextRequest } from "next/server";
import * as cheerio from "cheerio";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import {
    loadCache,
    saveCache,
    isCacheValid,
    type FF14AchievementsCache,
} from "../../lib/cache-utils";

export const revalidate = 21600; // ISR: 6時間ごとに再検証

const FF14_ACHIEVEMENTS_CACHE_FILE = "ff14-achievements-cache.json";

const CHARACTER_ID = config.profiles.ff14.characterId || "27095571";
const LODESTONE_BASE_URL = "https://jp.finalfantasyxiv.com";
const ACHIEVEMENTS_URL = `${LODESTONE_BASE_URL}/lodestone/character/${CHARACTER_ID}/achievement/`;

const FETCH_TIMEOUT = 15000;

interface FF14AchievementEntry {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    date: string;
    category?: string;
}

async function fetchWithTimeout(url: string, timeout: number = FETCH_TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "ja,en;q=0.9",
            },
            signal: controller.signal,
            next: { revalidate: 3600 },
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * アチーブメントページをスクレイピング（ページネーション対応）
 */
async function scrapeAchievementsPage(pageUrl: string): Promise<{
    entries: FF14AchievementEntry[];
    nextPageUrl: string | null;
}> {
    const response = await fetchWithTimeout(pageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch achievements page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const entries: FF14AchievementEntry[] = [];

    // アチーブメントリストの各アイテムを処理
    // 構造: entry__achievement のクラスを持つ要素内のリンク
    $(".entry__achievement").each((_, element) => {
        const $item = $(element);

        // アチーブメント名を取得
        const $nameElement = $item.find(".entry__activity__txt");
        const title = $nameElement.text().trim();

        if (!title) return;

        // アチーブメント詳細ページのリンクを取得
        const $link = $item.find("a[href*='/achievement/detail/']");
        const href = $link.attr("href");
        const url = href ? `${LODESTONE_BASE_URL}${href}` : "";

        // アイコン画像を取得
        const $img = $item.find("img");
        const thumbnail = $img.attr("src");

        // IDを抽出（URLから）
        const idMatch = href?.match(/\/achievement\/detail\/(\d+)\//);
        const achievementId = idMatch ? idMatch[1] : `${Date.now()}-${Math.random()}`;
        const id = `ff14-achievement-${achievementId}`;

        // 日時を取得（ldst_strftime関数呼び出しからUnixタイムスタンプを抽出）
        const itemHtml = $.html($item);
        const timestampMatch = itemHtml.match(/ldst_strftime\((\d+),/);
        let date = new Date().toISOString();

        if (timestampMatch && timestampMatch[1]) {
            const unixTimestamp = parseInt(timestampMatch[1]);
            date = new Date(unixTimestamp * 1000).toISOString();
        }

        entries.push({
            id,
            title,
            url,
            thumbnail,
            date,
        });
    });

    // 次のページのURLを取得
    let nextPageUrl: string | null = null;
    const $nextLink = $(".btn__pager__next:not(.btn__pager__next--disabled)").find("a");
    if ($nextLink.length > 0) {
        const nextHref = $nextLink.attr("href");
        if (nextHref) {
            nextPageUrl = `${LODESTONE_BASE_URL}${nextHref}`;
        }
    }

    return { entries, nextPageUrl };
}

/**
 * 全ページのアチーブメントを取得
 */
async function scrapeAllAchievements(): Promise<FF14AchievementEntry[]> {
    const allEntries: FF14AchievementEntry[] = [];
    let currentUrl: string | null = ACHIEVEMENTS_URL;
    let pageCount = 0;
    const maxPages = 10; // 安全のため最大ページ数を制限

    while (currentUrl && pageCount < maxPages) {
        console.log(`Fetching achievements page ${pageCount + 1}: ${currentUrl}`);
        const { entries, nextPageUrl } = await scrapeAchievementsPage(currentUrl);
        allEntries.push(...entries);
        currentUrl = nextPageUrl;
        pageCount++;
    }

    console.log(`Total achievements fetched: ${allEntries.length}`);
    return allEntries;
}

/**
 * キャッシュを活用してアチーブメントを取得
 */
async function fetchAchievementsWithCache(): Promise<FF14AchievementEntry[]> {
    // キャッシュ読み込み
    const cache = await loadCache<FF14AchievementsCache>(FF14_ACHIEVEMENTS_CACHE_FILE);
    const cacheEntries = Object.values(cache);

    // キャッシュが有効で、十分なエントリがある場合はスクレイピングをスキップ
    const validCacheEntries = cacheEntries.filter(entry => isCacheValid(entry.cachedAt, 1)); // 1日有効

    if (validCacheEntries.length > 0) {
        console.log(`FF14 Achievements: Using ${validCacheEntries.length} cached entries`);
        // キャッシュからエントリを復元
        const cachedResults: FF14AchievementEntry[] = [];
        for (const [url, entry] of Object.entries(cache)) {
            if (isCacheValid(entry.cachedAt, 1)) {
                const idMatch = url.match(/\/achievement\/detail\/(\d+)\//);
                const achievementId = idMatch ? idMatch[1] : `cached-${Date.now()}`;
                cachedResults.push({
                    id: `ff14-achievement-${achievementId}`,
                    title: entry.title,
                    url,
                    date: entry.date,
                });
            }
        }
        return cachedResults;
    }

    // 新規スクレイピング
    console.log("FF14 Achievements: Fetching fresh data from Lodestone");
    const entries = await scrapeAllAchievements();

    // キャッシュに保存
    const newCacheEntries: FF14AchievementsCache = {};
    for (const entry of entries) {
        newCacheEntries[entry.url] = {
            date: entry.date,
            title: entry.title,
            cachedAt: new Date().toISOString(),
        };
    }
    await saveCache(FF14_ACHIEVEMENTS_CACHE_FILE, newCacheEntries);

    return entries;
}

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

export async function GET(request: NextRequest) {
    const { success, remaining } = await limiter(request);

    if (!success) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
                status: 429,
                headers: {
                    "X-RateLimit-Limit": "60",
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                },
            }
        );
    }

    try {
        const entries = await fetchAchievementsWithCache();

        // Post形式に変換
        const posts: Post[] = entries.map((entry) => ({
            id: entry.id,
            title: entry.title,
            url: entry.url,
            date: entry.date,
            platform: "ff14-achievement" as const,
            description: "アチーブメント",
            thumbnail: entry.thumbnail,
        }));

        // 日付降順でソート
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        console.error("FF14 Achievements API error:", error);
        const jsonResponse = NextResponse.json([]);
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    }
}
