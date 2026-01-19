import { NextResponse, NextRequest } from "next/server";
import * as cheerio from "cheerio";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import {
    loadCache,
    saveCache,
    isCacheValid,
    type FilmarksCache,
    type FilmarksCacheEntry,
} from "../../lib/cache-utils";

export const revalidate = 21600; // ISR: 6時間ごとに再検証（高速化）

const FILMARKS_CACHE_FILE = "filmarks-cache.json";

const FILMARKS_BASE_URL = "https://filmarks.com";
const MOVIES_URL = `${FILMARKS_BASE_URL}/users/${config.profiles.filmarks.username}/marks`;
const DRAMAS_URL = `${FILMARKS_BASE_URL}/users/${config.profiles.filmarks.username}/marks/dramas`;
const ANIMES_URL = `${FILMARKS_BASE_URL}/users/${config.profiles.filmarks.username}/marks/animes`;

interface FilmarksEntry {
    id: string;
    title: string;
    url: string;
    thumbnail: string | undefined;
    rating: number | undefined;
    contentType: "movie" | "drama" | "anime";
    date?: string; // ISO date string
}

const USERNAME = config.profiles.filmarks.username;

// タイムアウト付きfetch
const FETCH_TIMEOUT = 5000; // 5秒
const BATCH_SIZE = 5; // 同時フェッチ数

/**
 * 個別の映画/ドラマページからマーク日時を取得
 * URLにmark_idが含まれている場合、そのページにユーザーのレビュー日時が表示される
 */
async function fetchMarkDate(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
            },
            signal: controller.signal,
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            return null;
        }

        const html = await response.text();

        // ユーザー名の近くにある日時を探す（形式: "2024/09/28 11:08"）
        // パターン: ユーザー名...日時 の形式でマッチ
        const usernamePattern = new RegExp(
            `${USERNAME}[\\s\\S]*?(\\d{4}\\/(0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])\\s+\\d{2}:\\d{2})`,
            'i'
        );
        const match = html.match(usernamePattern);

        if (match && match[1]) {
            // "2024/09/28 11:08" を ISO形式に変換
            const dateStr = match[1].replace(/\//g, '-').replace(' ', 'T') + ':00+09:00';
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        }

        return null;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn(`Timeout fetching mark date from ${url}`);
        } else {
            console.error(`Error fetching mark date from ${url}:`, error);
        }
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * キャッシュを活用してマーク日時を取得（大幅高速化）
 * - キャッシュヒット: fetchスキップ
 * - キャッシュミス: 新規エントリのみfetch
 */
async function fetchMarkDatesWithCache(
    entries: FilmarksEntry[]
): Promise<(FilmarksEntry & { date: string })[]> {
    // キャッシュ読み込み
    const cache = await loadCache<FilmarksCache>(FILMARKS_CACHE_FILE);

    const results: (FilmarksEntry & { date: string })[] = [];
    const newEntries: FilmarksEntry[] = [];
    const newCacheEntries: FilmarksCache = {};

    // キャッシュヒット/ミスを分類
    for (const entry of entries) {
        const cached = cache[entry.url];
        if (cached && isCacheValid(cached.cachedAt)) {
            // キャッシュヒット - fetchスキップ
            results.push({ ...entry, date: cached.date });
        } else {
            // キャッシュミス - 後でfetch
            newEntries.push(entry);
        }
    }

    // 新規エントリのみバッチ処理でfetch
    if (newEntries.length > 0) {
        console.log(
            `Filmarks: ${entries.length - newEntries.length} cache hits, ${newEntries.length} new entries to fetch`
        );

        for (let i = 0; i < newEntries.length; i += BATCH_SIZE) {
            const batch = newEntries.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map(async (entry) => {
                    const markDate = await fetchMarkDate(entry.url);
                    const date = markDate || new Date().toISOString();

                    // 新しいキャッシュエントリを作成
                    newCacheEntries[entry.url] = {
                        date,
                        title: entry.title,
                        cachedAt: new Date().toISOString(),
                    };

                    return { ...entry, date };
                })
            );
            results.push(...batchResults);
        }

        // 新規エントリをキャッシュに保存
        await saveCache(FILMARKS_CACHE_FILE, newCacheEntries);
    } else {
        console.log(`Filmarks: All ${entries.length} entries from cache`);
    }

    return results;
}

async function scrapeFilmarksPage(url: string, contentType: "movie" | "drama" | "anime"): Promise<FilmarksEntry[]> {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
            },
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            console.error(`Filmarks fetch failed: ${response.status}`);
            return [];
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const entries: FilmarksEntry[] = [];
        const seenIds = new Set<string>();

        // Filmarksの構造: div.c-content-card がカードコンテナ
        $("div.c-content-card").each((_, element) => {
            const $card = $(element);

            // タイトルとリンクを取得
            const $titleLink = $card.find("h3.c-content-card__title a").first();
            const href = $titleLink.attr("href");

            if (!href) return;

            // 映画/ドラマ/アニメをURLで判定
            const isMovie = href.includes("/movies/");
            const isDrama = href.includes("/dramas/");
            const isAnime = href.includes("/animes/");

            // 該当するコンテンツタイプでない場合はスキップ
            if (contentType === "movie" && !isMovie) return;
            if (contentType === "drama" && !isDrama) return;
            if (contentType === "anime" && !isAnime) return;

            // mark_idがない場合はスキップ（重複防止のため）
            if (!href.includes("mark_id=")) return;

            // IDを抽出
            const markIdMatch = href.match(/mark_id=(\d+)/);
            const id = markIdMatch ? `filmarks-${contentType}-${markIdMatch[1]}` : `filmarks-${contentType}-${Date.now()}`;

            // 重複チェック
            if (seenIds.has(id)) return;
            seenIds.add(id);

            // タイトルを取得（全テキストから年情報を削除）
            let title = $titleLink.text().trim();
            // タイトルから年情報を削除（例: "国宝(2025年製作の映画)" → "国宝"）
            title = title.replace(/\(\d{4}年製作の(映画|ドラマ|TVアニメ)\)/, "").trim();

            // タイトルがない場合はスキップ
            if (!title) return;

            // サムネイルを取得（c-content__jacket内のimg）
            const $img = $card.find("a.c-content__jacket img").first();
            const thumbnail: string | undefined = $img.attr("src");

            // 評価を取得
            const ratingText = $card.find("div.c-rating__score").first().text().trim();
            const rating = ratingText ? parseFloat(ratingText) : undefined;

            // 完全なURLを構築
            const fullUrl = href.startsWith("http") ? href : `${FILMARKS_BASE_URL}${href}`;

            entries.push({
                id,
                title,
                url: fullUrl,
                thumbnail,
                rating: rating && !isNaN(rating) ? rating : undefined,
                contentType,
            });
        });

        return entries;
    } catch (error) {
        console.error(`Error scraping Filmarks ${contentType}:`, error);
        return [];
    }
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
        // 映画・ドラマ・アニメを並列で取得
        const [movies, dramas, animes] = await Promise.all([
            scrapeFilmarksPage(MOVIES_URL, "movie"),
            scrapeFilmarksPage(DRAMAS_URL, "drama"),
            scrapeFilmarksPage(ANIMES_URL, "anime"),
        ]);

        // Post形式に変換
        const allEntries = [...movies, ...dramas, ...animes];

        // 各エントリの実際のマーク日時をキャッシュ活用で取得（大幅高速化）
        const entriesWithDates = await fetchMarkDatesWithCache(allEntries);

        const posts: Post[] = entriesWithDates.map((entry) => ({
            id: entry.id,
            title: entry.title,
            url: entry.url,
            date: entry.date,
            platform: "filmarks" as const,
            description: entry.contentType === "movie" ? "映画" : entry.contentType === "drama" ? "ドラマ" : "アニメ",
            thumbnail: entry.thumbnail,
            rating: entry.rating,
        }));

        // 日付降順でソート（トップページと同様）
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const jsonResponse = NextResponse.json(posts);
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        console.error("Filmarks API error:", error);
        const jsonResponse = NextResponse.json([]);
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    }
}
