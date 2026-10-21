/**
 * Google Sheets v4 REST の薄いクライアント（Swarm inbox 用）。
 *
 * 認証は Application Default Credentials:
 *   - GitHub Actions: google-github-actions/auth が置く external_account 資格情報。
 *     スコープはサービスアカウント impersonation 時に付くので、ここで spreadsheets を指定すれば足りる
 *   - ローカル: `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/spreadsheets`
 * `googleapis` パッケージは大きいので、@google-cloud/storage が既に依存している google-auth-library だけで組む。
 * Sheet 自体は本人の Drive にあり、サービスアカウントを「編集者」で共有しているだけ（IAM ロールは不要）。
 */

import { GoogleAuth } from "google-auth-library";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

export interface SheetsClient {
    /** 先頭タブの gid。行削除（batchUpdate）はタブを gid で指定する必要がある */
    getFirstSheetId(spreadsheetId: string): Promise<number>;
    /** 範囲内の行（末尾の空セルは API 側で省かれる。空行は [] で返る） */
    readRows(spreadsheetId: string, range: string): Promise<string[][]>;
    /** 2 行目から count 行を削除する（1 行目のヘッダは残す） */
    deleteRows(spreadsheetId: string, sheetId: number, count: number): Promise<void>;
}

interface SpreadsheetMeta {
    sheets?: { properties?: { sheetId?: number; index?: number } }[];
}

interface ValueRange {
    values?: string[][];
}

export async function createSheetsClient(): Promise<SheetsClient> {
    const auth = new GoogleAuth({ scopes: [SHEETS_SCOPE] });

    async function call<T>(url: string, method: "GET" | "POST", data?: unknown): Promise<T> {
        const res = await auth.request<T>({ url, method, data });
        return res.data;
    }

    return {
        async getFirstSheetId(spreadsheetId) {
            const meta = await call<SpreadsheetMeta>(
                `${API_BASE}/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties(sheetId,index)`,
                "GET",
            );
            const first = meta.sheets?.find((s) => s.properties?.index === 0) ?? meta.sheets?.[0];
            const sheetId = first?.properties?.sheetId;
            if (sheetId === undefined) throw new Error("Spreadsheet has no sheets");
            return sheetId;
        },

        async readRows(spreadsheetId, range) {
            const data = await call<ValueRange>(
                `${API_BASE}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`,
                "GET",
            );
            return data.values ?? [];
        },

        async deleteRows(spreadsheetId, sheetId, count) {
            if (count <= 0) return;
            await call(`${API_BASE}/${encodeURIComponent(spreadsheetId)}:batchUpdate`, "POST", {
                requests: [
                    {
                        deleteDimension: {
                            // 0 始まり・end 排他。startIndex 1 = 2 行目。読み取り後に IFTTT が追記した行は
                            // この範囲より下にあるので消えず、上に詰まるだけ
                            range: { sheetId, dimension: "ROWS", startIndex: 1, endIndex: 1 + count },
                        },
                    },
                ],
            });
        },
    };
}
