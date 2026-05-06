/**
 * フィード JSON の保管バックエンドを切り替える共通ユーティリティ。
 *
 * - `GCS_BUCKET` 環境変数があれば GCS (production / GitHub Actions)
 * - 無ければ `public/data/` 配下にローカルファイル (開発)
 *
 * 読み取りは bucket が public-read なため fetch で直接取得する (認証不要)。
 * 書き込みは @google-cloud/storage SDK + Application Default Credentials を使う
 * (GitHub Actions では google-github-actions/auth が ADC を整える)。
 */

import * as fs from "fs";
import * as path from "path";

import { Storage } from "@google-cloud/storage";

const FEED_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=3600";

const LOCAL_DATA_DIR = path.join(process.cwd(), "public/data");

let storageClient: Storage | null = null;

function getStorage(): Storage {
    if (!storageClient) storageClient = new Storage();
    return storageClient;
}

function bucketName(): string | undefined {
    return process.env.GCS_BUCKET;
}

export function feedPublicUrl(filename: string): string {
    const bucket = bucketName();
    if (!bucket) {
        return `file://${path.join(LOCAL_DATA_DIR, filename)}`;
    }
    return `https://storage.googleapis.com/${bucket}/${filename}`;
}

/**
 * フィード JSON を読み込む。
 *
 * - GCS_BUCKET 設定時は public URL を fetch
 * - 未設定時は `public/data/` から fs 読み
 *
 * 取得失敗時は fallback を返す (デフォルト: throw)。
 */
export async function readFeed<T>(filename: string, fallback?: T): Promise<T> {
    const bucket = bucketName();
    if (bucket) {
        const url = `https://storage.googleapis.com/${bucket}/${filename}`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.status === 404 && fallback !== undefined) return fallback;
        if (!res.ok) {
            if (fallback !== undefined) return fallback;
            throw new Error(`readFeed(${filename}) failed: HTTP ${res.status}`);
        }
        return (await res.json()) as T;
    }
    const filePath = path.join(LOCAL_DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
        if (fallback !== undefined) return fallback;
        throw new Error(`readFeed(${filename}) failed: local file not found`);
    }
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

/**
 * フィード JSON を保存する。
 *
 * - GCS_BUCKET 設定時は SDK で PUT (public-read & Cache-Control)
 * - 未設定時は `public/data/` に fs 書き込み
 */
export async function writeFeed(filename: string, data: unknown): Promise<void> {
    const body = JSON.stringify(data, null, 2) + "\n";
    const bucket = bucketName();
    if (bucket) {
        await getStorage().bucket(bucket).file(filename).save(body, {
            contentType: "application/json; charset=utf-8",
            metadata: { cacheControl: FEED_CACHE_CONTROL },
            resumable: false,
        });
        return;
    }
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_DATA_DIR, filename), body);
}

/**
 * バイナリ (画像など) を保存する。返り値は public URL (GCS) かローカル相対パス (開発)。
 *
 * 例: `writeBinary("images/apps/foo.jpg", buf, "image/jpeg")`
 *      → prod: https://storage.googleapis.com/<bucket>/images/apps/foo.jpg
 *      → dev:  /images/apps/foo.jpg
 */
export async function writeBinary(
    objectPath: string,
    body: Buffer,
    contentType: string,
): Promise<string> {
    const bucket = bucketName();
    if (bucket) {
        await getStorage().bucket(bucket).file(objectPath).save(body, {
            contentType,
            metadata: { cacheControl: "public, max-age=86400" },
            resumable: false,
        });
        return `https://storage.googleapis.com/${bucket}/${objectPath}`;
    }
    const localPath = path.join(process.cwd(), "public", objectPath);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, body);
    return `/${objectPath}`;
}
