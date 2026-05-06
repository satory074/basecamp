/**
 * フィード JSON のランタイム読み取り。
 *
 * - `GCS_BUCKET` 環境変数が設定されているとき (prod / Cloud Run): 公開 GCS URL を fetch し、
 *   Next.js の ISR (`next: { revalidate }`) で 5 分キャッシュする。
 * - 未設定時 (ローカル開発): `public/data/` 配下のファイルを `fs.readFile` で読む。
 *
 * Server Component / Route Handler 両方から使える。
 */

import { promises as fs } from "fs";
import * as path from "path";

const ISR_REVALIDATE_SEC = 300;
const LOCAL_DATA_DIR = path.join(process.cwd(), "public/data");

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
