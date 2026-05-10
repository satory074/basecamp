/**
 * フィード JSON のランタイム読み書き。
 *
 * - `GCS_BUCKET` 環境変数が設定されているとき (prod / Cloud Run): 公開 GCS URL を fetch し、
 *   Next.js の ISR (`next: { revalidate }`) で 5 分キャッシュする。書き込みは
 *   `@google-cloud/storage` SDK + ADC (Cloud Run runtime SA に bucket 書き込み権限が必要)。
 * - 未設定時 (ローカル開発): `public/data/` 配下のファイルを `fs` で読み書き。
 *
 * Server Component / Route Handler 両方から使える。
 */

import { promises as fs } from "fs";
import * as path from "path";

const ISR_REVALIDATE_SEC = 300;
const LOCAL_DATA_DIR = path.join(process.cwd(), "public/data");
const FEED_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=3600";

export function feedUrl(filename: string): string | null {
    const bucket = process.env.GCS_BUCKET;
    return bucket ? `https://storage.googleapis.com/${bucket}/${filename}` : null;
}

export async function readFeedJson<T>(filename: string): Promise<T> {
    const url = feedUrl(filename);
    if (url) {
        const res = await fetch(url, { next: { revalidate: ISR_REVALIDATE_SEC } });
        if (!res.ok) {
            throw new Error(`readFeedJson(${filename}) HTTP ${res.status}`);
        }
        return (await res.json()) as T;
    }
    const filePath = path.join(LOCAL_DATA_DIR, filename);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
}

/**
 * 書き込み直前に最新値を読む (read-after-write consistency が必要なとき用)。
 *
 * Public URL (`https://storage.googleapis.com/<bucket>/<file>`) は Cache-Control:
 * `public, max-age=300` で Google の edge にキャッシュされるため、ingest 直前の書き込みを
 * 反映できないことがある。SDK の `download()` は GCS Strong Consistency 直接 API を使うので
 * 直前の write を確実に読める。
 */
export async function readFeedFresh<T>(filename: string, fallback: T): Promise<T> {
    const bucket = process.env.GCS_BUCKET;
    if (bucket) {
        const { Storage } = await import("@google-cloud/storage");
        const storage = new Storage();
        const file = storage.bucket(bucket).file(filename);
        try {
            const [buf] = await file.download();
            return JSON.parse(buf.toString("utf-8")) as T;
        } catch (err) {
            const code = (err as { code?: number }).code;
            if (code === 404) return fallback;
            throw err;
        }
    }
    const filePath = path.join(LOCAL_DATA_DIR, filename);
    try {
        const content = await fs.readFile(filePath, "utf-8");
        return JSON.parse(content) as T;
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
        throw err;
    }
}

export async function writeFeedJson(filename: string, data: unknown): Promise<void> {
    const body = JSON.stringify(data, null, 2) + "\n";
    const bucket = process.env.GCS_BUCKET;
    if (bucket) {
        const { Storage } = await import("@google-cloud/storage");
        const storage = new Storage();
        await storage.bucket(bucket).file(filename).save(body, {
            contentType: "application/json; charset=utf-8",
            metadata: { cacheControl: FEED_CACHE_CONTROL },
            resumable: false,
        });
        return;
    }
    await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(LOCAL_DATA_DIR, filename), body);
}
