/**
 * 道具ページ (/decks/) の中身。手で書いて git に入れる。
 *
 * 以前は public/data/decks.json を build 時に fs で読んでいたが、2026-05 に public/data/*.json を
 * gitignore したとき一緒に外れ、本番は半年「まだ記録がありません」のままだった (読めないと黙って空を出していた)。
 * TypeScript にしておけば、項目の書き漏れや型の間違いは `npm run build` で止まる。
 *
 * - 一覧を直したら DECKS_AS_OF も更新する (ページに「◯年◯月時点」と出る)
 * - note は「何に使っているか」を事実だけで 1 行。理由を推測で書かない
 * - url は公式ページ。販売終了でページが無い機材は url を書かない (名前だけ出る)。アフィリエイトは使わない
 * - related はこのサイトの記録ページ (NAV_GROUPS にあるパス。decks.test.ts が確かめる)
 */

export interface DeckItem {
    /** サイト内で一意 */
    id: string;
    name: string;
    /** 何に使っているかの 1 行 */
    note: string;
    /** 公式ページ (https)。無ければリンクしない */
    url?: string;
    /** このサイトでその道具の記録が見られるページ */
    related?: { href: string; label: string };
}

export interface DeckCategory {
    id: string;
    name: string;
    items: DeckItem[];
}

export interface DeckSection {
    id: "software" | "hardware";
    name: string;
    categories: DeckCategory[];
}

/** この一覧がいつ時点のものか (YYYY-MM) */
export const DECKS_AS_OF = "2026-11";

/** "2026-11" → "2026年11月" */
export function formatAsOf(asOf: string): string {
    const [year, month] = asOf.split("-");
    return `${year}年${Number(month)}月`;
}

export const DECK_SECTIONS: DeckSection[] = [
    {
        id: "software",
        name: "ソフト",
        categories: [
            {
                id: "dev",
                name: "開発",
                items: [
                    {
                        id: "claude-code",
                        name: "Claude Code（Max プラン）",
                        note: "実装はほぼ任せている。このサイトもこれで作っている",
                        url: "https://claude.com/product/claude-code",
                        related: { href: "/apps/", label: "作ったアプリ" },
                    },
                    {
                        id: "ghostty",
                        name: "Ghostty",
                        note: "ターミナル。Claude Code はここで動かしている",
                        url: "https://ghostty.org/",
                    },
                    {
                        id: "zsh",
                        name: "zsh",
                        note: "oh-my-zsh と Starship。ディレクトリの移動は zoxide と fzf",
                        url: "https://www.zsh.org/",
                    },
                    {
                        id: "gh",
                        name: "GitHub CLI",
                        note: "PR・Actions・Secrets をターミナルから操作する",
                        url: "https://cli.github.com/",
                    },
                    {
                        id: "uv",
                        name: "uv",
                        note: "Python のパッケージ管理",
                        url: "https://docs.astral.sh/uv/",
                    },
                    {
                        id: "gcloud",
                        name: "Google Cloud CLI",
                        note: "このサイトのフィードを置いている GCS と Cloud Run の操作",
                        url: "https://cloud.google.com/sdk/gcloud",
                    },
                ],
            },
            {
                id: "browser",
                name: "ブラウザ",
                items: [
                    {
                        id: "chrome",
                        name: "Google Chrome",
                        note: "Vimium でキーボードだけで操作する",
                        url: "https://www.google.com/chrome/",
                    },
                ],
            },
            {
                id: "utility",
                name: "効率化",
                items: [
                    {
                        id: "alfred",
                        name: "Alfred",
                        note: "ランチャー",
                        url: "https://www.alfredapp.com/",
                    },
                    {
                        id: "clipy",
                        name: "Clipy",
                        note: "クリップボードの履歴",
                        url: "https://clipy-app.com/",
                    },
                    {
                        id: "karabiner-elements",
                        name: "Karabiner-Elements",
                        note: "キー配置の変更",
                        url: "https://karabiner-elements.pqrs.org/",
                    },
                    {
                        id: "dropbox",
                        name: "Dropbox",
                        note: "ファイルの同期",
                        url: "https://www.dropbox.com/",
                    },
                ],
            },
            {
                id: "music-software",
                name: "音楽",
                items: [
                    {
                        id: "logic-pro",
                        name: "Logic Pro",
                        note: "Kawaii Future Bass の作曲とマッシュアップ",
                        url: "https://www.apple.com/jp/logic-pro/",
                        related: { href: "/soundcloud/", label: "作った曲" },
                    },
                ],
            },
        ],
    },
    {
        id: "hardware",
        name: "機材",
        categories: [
            {
                id: "mac",
                name: "Mac",
                items: [
                    {
                        id: "macbook-pro",
                        name: "MacBook Pro 13インチ（M1, 2020, 16GB）",
                        note: "開発も作曲もこの 1 台",
                    },
                ],
            },
            {
                id: "input",
                name: "入力",
                items: [
                    {
                        id: "hhkb-hybrid",
                        name: "HHKB Professional HYBRID",
                        note: "Bluetooth で Mac につないでいる",
                        url: "https://happyhackingkb.com/jp/products/hybrid/",
                    },
                    {
                        id: "magic-trackpad-2",
                        name: "Magic Trackpad 2",
                        note: "マウスの代わり",
                    },
                ],
            },
            {
                id: "audio",
                name: "音",
                items: [
                    {
                        id: "airpods-pro",
                        name: "AirPods Pro",
                        note: "イヤホン",
                        url: "https://www.apple.com/jp/airpods-pro/",
                    },
                ],
            },
            {
                id: "mobile",
                name: "手元",
                items: [
                    {
                        id: "iphone-se",
                        name: "iPhone SE（第3世代）",
                        note: "スマートフォン",
                    },
                    {
                        id: "apple-watch",
                        name: "Apple Watch",
                        note: "腕時計",
                        url: "https://www.apple.com/jp/watch/",
                    },
                ],
            },
            {
                id: "games",
                name: "ゲーム",
                items: [
                    {
                        id: "ps5",
                        name: "PS5",
                        note: "トロフィーとプレイ時間をこのサイトに記録している",
                        url: "https://www.playstation.com/ja-jp/ps5/",
                        related: { href: "/playstation/", label: "PlayStation の記録" },
                    },
                    {
                        id: "steam-deck",
                        name: "Steam Deck",
                        note: "Steam の実績をこのサイトに記録している",
                        url: "https://www.steamdeck.com/ja/",
                        related: { href: "/steam/", label: "Steam の実績" },
                    },
                ],
            },
            {
                id: "music-hardware",
                name: "音楽",
                items: [
                    {
                        id: "roland-fa-07",
                        name: "Roland FA-07",
                        note: "シンセサイザー（ミュージック・ワークステーション）",
                        url: "https://www.roland.com/jp/products/fa-07/",
                    },
                ],
            },
        ],
    },
];
