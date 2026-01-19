/**
 * ファイルベースのキャッシュユーティリティ
 * Filmarks/Booklog APIの高速化用
 */
import { promises as fs } from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "public/data");

export interface FilmarksCacheEntry {
    date: string;
    title: string;
    cachedAt: string;
}

export interface BooklogCacheEntry {
    status: string;
    cachedAt: string;
}

export type FilmarksCache = Record<string, FilmarksCacheEntry>;
export type BooklogCache = Record<string, BooklogCacheEntry>;

/**
 * キャッシュファイルを読み込む
 */
export async function loadCache<T extends Record<string, unknown>>(
    filename: string
): Promise<T> {
    try {
        const filePath = path.join(CACHE_DIR, filename);
        const data = await fs.readFile(filePath, "utf-8");
        return JSON.parse(data) as T;
    } catch {
        // ファイルが存在しない、またはパースエラーの場合は空オブジェクト
        return {} as T;
    }
}

/**
 * キャッシュファイルに保存（マージ）
 */
export async function saveCache<T extends Record<string, unknown>>(
    filename: string,
    newData: T
): Promise<void> {
    try {
        const filePath = path.join(CACHE_DIR, filename);

        // 既存のキャッシュを読み込み
        let existingCache: T = {} as T;
        try {
            const existing = await fs.readFile(filePath, "utf-8");
            existingCache = JSON.parse(existing) as T;
        } catch {
            // 既存ファイルがない場合は空で開始
        }

        // マージして保存
        const mergedCache = { ...existingCache, ...newData };
        await fs.writeFile(filePath, JSON.stringify(mergedCache, null, 2));
    } catch (error) {
        console.error(`Failed to save cache ${filename}:`, error);
        // キャッシュ保存失敗は無視（機能に影響なし）
    }
}

/**
 * キャッシュエントリの有効期限をチェック（デフォルト30日）
 */
export function isCacheValid(
    cachedAt: string,
    maxAgeDays: number = 30
): boolean {
    const cachedDate = new Date(cachedAt);
    const now = new Date();
    const diffDays =
        (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays < maxAgeDays;
}
