/**
 * ブクログの本棚ページ (display=image) の解釈と、フィードを書き換えてよいかの判定。
 * 取得 (fetch) とは切り離した純粋関数にしてある (shelf.test.ts で不変条件を確かめる)。
 */

import * as cheerio from "cheerio";

export interface ShelfItem {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    status: string;
    rating?: number;
    finishedDate?: string;
    category?: string;
    tags?: string[];
    shelfAddedAt?: string;
}

interface DataBook {
    id?: string;
    service_id?: string;
    title?: string;
    image?: string;
    status_name?: string;
    rank?: string;
    read_at?: string | null;
    create_on?: string;
    category_name?: string | false;
    tags?: string[];
}

/** `read_at` ("2026-04-06 00:00:00") → "2026年4月6日" */
function formatReadAt(readAt: string | null | undefined): string | undefined {
    if (!readAt) return undefined;
    const match = readAt.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!match) return undefined;
    return `${match[1]}年${parseInt(match[2], 10)}月${parseInt(match[3], 10)}日`;
}

/** `read_at` / `create_on` を ISO 8601 (+09:00) にする。ブクログは JST で返す */
function toIsoJst(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    const match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/);
    if (!match) return undefined;
    const [, y, m, d, hh, mm, ss] = match;
    const pad = (s: string) => s.padStart(2, "0");
    return `${y}-${pad(m)}-${pad(d)}T${pad(hh ?? "0")}:${pad(mm ?? "0")}:${pad(ss ?? "0")}+09:00`;
}

/**
 * 本棚 1 ページ分の HTML から本を取り出す。各本の `div.item-wrapper.shelf-item` の
 * `data-book` 属性に書誌・状態・評価 (`rank`)・読了日・カテゴリ・タグが JSON で入っている。
 * 評価は `rank` ("0"〜"5") で、"0" は未評価。
 */
export function parseShelfHtml(html: string): ShelfItem[] {
    const $ = cheerio.load(html);
    const items: ShelfItem[] = [];

    $("div.item-wrapper.shelf-item").each((_, element) => {
        const raw = $(element).attr("data-book");
        if (!raw) return;
        let data: DataBook;
        try {
            data = JSON.parse(raw) as DataBook;
        } catch {
            return;
        }
        if (!data.id || !data.title) return;

        const serviceId = data.service_id || "1";
        const rank = data.rank ? parseInt(data.rank, 10) : 0;
        const category = typeof data.category_name === "string" && data.category_name && data.category_name !== "未設定"
            ? data.category_name
            : undefined;

        items.push({
            id: data.id,
            title: data.title,
            url: `https://booklog.jp/item/${serviceId}/${data.id}`,
            thumbnail: data.image ? data.image.replace(/^http:/, "https:") : undefined,
            status: data.status_name || "",
            rating: rank > 0 ? rank : undefined,
            finishedDate: formatReadAt(data.read_at),
            category,
            tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
            shelfAddedAt: toIsoJst(data.read_at) || toIsoJst(data.create_on),
        });
    });

    return items;
}

/** ブクログの bot チェック (AWS WAF) の画面か。GitHub Actions からは HTTP 202 + この文言が返る */
export function isBotChallenge(status: number, html: string): boolean {
    return status === 202 || /verify that you(?:'|&#39;)re not a robot/i.test(html);
}

export type WriteDecision =
    | { write: false; reason: string }
    | { write: true; status: "success" | "warning"; warning?: string };

/** 既存より少ないとき warning にする割合 (古い本はマージで残るが、評価・状態が更新されない) */
const PARTIAL_RATIO = 0.9;

/**
 * 本棚から取れた冊数で、フィードを書き換えてよいかを決める。
 * 0 冊のときは書かない。書くと既存データのまま lastUpdated だけ進み、
 * Daily Digest の stale 検知が働かなくなる (2026-10-07〜11-22 に実際に起きた)。
 */
export function decideWrite(shelfCount: number, existingCount: number): WriteDecision {
    if (shelfCount === 0) {
        return { write: false, reason: "本棚から 1 冊も取れなかった" };
    }
    if (existingCount > 0 && shelfCount < existingCount * PARTIAL_RATIO) {
        return {
            write: true,
            status: "warning",
            warning: `本棚の一部しか取れなかった (${shelfCount} / ${existingCount} 冊)`,
        };
    }
    return { write: true, status: "success" };
}
