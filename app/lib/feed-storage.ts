/**
 * フィード JSON のビルド時読み取り。
 *
 * - `GCS_BUCKET` 環境変数が設定されているとき (prod build): 公開 GCS URL を fetch
 * - 未設定時 (ローカル開発): `public/data/` 配下のファイルを `fs` で読む
 *
 * Static export では Server Component / Route Handler の build 時に呼ばれるのみ。
 */

import { promises as fs } from "fs";
import * as path from "path";

const LOCAL_DATA_DIR = path.join(process.cwd(), "public/data");

export function feedUrl(filename: string): string | null {
    const bucket = process.env.GCS_BUCKET;
    return bucket ? `https://storage.googleapis.com/${bucket}/${filename}` : null;
}

export async function readFeedJson<T>(filename: string): Promise<T> {
    const url = feedUrl(filename);
    if (url) {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`readFeedJson(${filename}) HTTP ${res.status}`);
        }
        return (await res.json()) as T;
    }
    const filePath = path.join(LOCAL_DATA_DIR, filename);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
}
