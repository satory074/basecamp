import type { Metadata } from "next";
import { PLATFORMS, type PlatformKey } from "./platforms";
import { buildMetadata, pageTitle } from "./seo";

/**
 * サイト内ナビの台帳。ヘッダーのパネル・サイトマップ・各ページの metadata がここを読む。
 * 以前は Sidebar.tsx と HomeSidebar.tsx に同じ配列がコピーされていた。
 */
export interface NavEntry {
    key: PlatformKey;
    /** 末尾スラッシュ付き (next.config の trailingSlash: true と揃える) */
    path: string;
    /** そのページで何が見られるか (パネルと meta description に使う) */
    description: string;
}

export interface NavGroup {
    id: string;
    label: string;
    entries: NavEntry[];
}

export const NAV_GROUPS: NavGroup[] = [
    {
        id: "dev",
        label: "開発",
        entries: [
            { key: "github", path: "/github/", description: "公開リポジトリと更新" },
            { key: "apps", path: "/apps/", description: "作ったアプリ" },
        ],
    },
    {
        id: "writing",
        label: "ブログ・記事",
        entries: [
            { key: "hatena", path: "/hatena/", description: "ブログ記事" },
            { key: "zenn", path: "/zenn/", description: "技術記事" },
            { key: "note", path: "/note/", description: "記事" },
            { key: "hatenabookmark", path: "/hatenabookmark/", description: "ブックマークした記事" },
        ],
    },
    {
        id: "sns",
        label: "SNS",
        entries: [{ key: "x", path: "/x/", description: "投稿・いいね・ブックマーク" }],
    },
    {
        id: "language-music",
        label: "語学・音楽",
        entries: [
            { key: "duolingo", path: "/duolingo/", description: "語学の学習記録" },
            { key: "spotify", path: "/spotify/", description: "最近聴いた曲" },
            { key: "soundcloud", path: "/soundcloud/", description: "作った曲" },
        ],
    },
    {
        id: "books-films",
        label: "読書・映画",
        entries: [
            { key: "booklog", path: "/booklog/", description: "読書記録" },
            { key: "filmarks", path: "/filmarks/", description: "観た映画・ドラマ・アニメ" },
        ],
    },
    {
        id: "journal",
        label: "日記",
        entries: [
            { key: "diary", path: "/diary/", description: "毎日の活動のまとめ" },
            { key: "alco", path: "/alco/", description: "飲んだお酒" },
        ],
    },
    {
        id: "places",
        label: "場所",
        entries: [{ key: "swarm", path: "/swarm/", description: "行った場所" }],
    },
    {
        id: "games",
        label: "ゲーム",
        entries: [
            { key: "playstation", path: "/playstation/", description: "トロフィーとプレイ時間" },
            { key: "steam", path: "/steam/", description: "実績" },
            { key: "ff14", path: "/ff14/", description: "キャラクター" },
            { key: "tenhou", path: "/tenhou/", description: "麻雀の対局成績" },
            { key: "decks", path: "/decks/", description: "使用中のツール・サービス" },
        ],
    },
    {
        id: "sports",
        label: "スポーツ",
        entries: [{ key: "baseball", path: "/baseball/", description: "順位表と試合結果" }],
    },
];

/**
 * ヘッダーに常時出すリンク (幅が足りないときはパネルにだけ出る)。
 * 2026-11 時点は空 = サイト名と「すべてのページ」だけ。足すときは例えば ["apps", "diary"]
 */
export const FEATURED_KEYS: PlatformKey[] = [];

export const NAV_ENTRIES: NavEntry[] = NAV_GROUPS.flatMap((g) => g.entries);

/** ナビに載らないが親を持つページ (現在地表示を親に寄せる) */
const NAV_PARENT: Partial<Record<string, string>> = {
    "/ff14-achievements/": "/ff14/",
};

function normalizePath(pathname: string): string {
    if (!pathname) return "/";
    const withSlash = pathname.endsWith("/") ? pathname : `${pathname}/`;
    return withSlash;
}

/** pathname がそのナビ項目のページ (または配下) か */
export function isCurrent(pathname: string, entryPath: string): boolean {
    const path = normalizePath(pathname);
    const resolved = NAV_PARENT[path] ?? path;
    if (entryPath === "/") return resolved === "/";
    return resolved === entryPath || resolved.startsWith(entryPath);
}

export function navEntry(key: PlatformKey): NavEntry | undefined {
    return NAV_ENTRIES.find((e) => e.key === key);
}

/**
 * 各ページの metadata。タイトルの形 (「<ページ名> | satory074」) と canonical をそろえる。
 * ナビに無いページ (例: /ff14-achievements/) は path を渡す。
 */
export function pageMetadata(key: PlatformKey, description?: string, path?: string): Metadata {
    const entry = navEntry(key);
    const resolvedPath = path ?? entry?.path;
    if (!resolvedPath) throw new Error(`pageMetadata: "${key}" はナビに無いので path を渡してください`);
    return buildMetadata({
        title: pageTitle(PLATFORMS[key].label),
        description: description ?? entry?.description ?? PLATFORMS[key].label,
        path: resolvedPath,
    });
}

/** サイトマップに載せるパス (ホーム + ナビの全ページ) */
export const SITEMAP_PATHS: string[] = ["/", ...NAV_ENTRIES.map((e) => e.path)];
