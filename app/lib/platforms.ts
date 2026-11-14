/**
 * プラットフォームの台帳 (single source of truth)。
 *
 * 表示名・色はここだけに書く。以前は CSS 変数 (globals.css) と JS (shared/constants.ts) の
 * 2 か所に色があり、zenn / filmarks の値がずれていた。
 *
 * - `label`: ページ見出し・ナビ・カードに出す正式名
 * - `shortLabel`: 狭い場所 (タブ等) 用。無ければ label
 * - `color`: ライト / ダーク各配色での色。カードの縦線・バッジの淡い背景・グラフに使う
 */
export interface PlatformDef {
    label: string;
    shortLabel?: string;
    color: { light: string; dark: string };
}

export const PLATFORMS = {
    github: { label: "GitHub", color: { light: "#24292e", dark: "#f0f0f0" } },
    hatena: { label: "はてなブログ", shortLabel: "はてな", color: { light: "#1a1a1a", dark: "#f0f0f0" } },
    zenn: { label: "Zenn", color: { light: "#3EA8FF", dark: "#3EA8FF" } },
    note: { label: "note", color: { light: "#41c9b4", dark: "#41c9b4" } },
    hatenabookmark: { label: "はてなブックマーク", shortLabel: "はてブ", color: { light: "#00A4DE", dark: "#00A4DE" } },
    x: { label: "X", color: { light: "#000000", dark: "#f0f0f0" } },
    duolingo: { label: "Duolingo", color: { light: "#58CC02", dark: "#6fe800" } },
    soundcloud: { label: "SoundCloud", color: { light: "#ff5500", dark: "#ff6622" } },
    spotify: { label: "Spotify", color: { light: "#1DB954", dark: "#1DB954" } },
    booklog: { label: "ブクログ", color: { light: "#4ea6cc", dark: "#6ec5e0" } },
    filmarks: { label: "Filmarks", color: { light: "#f7c600", dark: "#ffe64d" } },
    diary: { label: "日記", color: { light: "#D97706", dark: "#FCD34D" } },
    alco: { label: "飲酒記録", color: { light: "#A45C3B", dark: "#d98e68" } },
    swarm: { label: "Swarm", color: { light: "#FFA200", dark: "#ffb84d" } },
    steam: { label: "Steam", color: { light: "#142048", dark: "#66c0f4" } },
    playstation: { label: "PlayStation", color: { light: "#003791", dark: "#5599ff" } },
    tenhou: { label: "天鳳", color: { light: "#1a1a1a", dark: "#e0e0e0" } },
    ff14: { label: "FF14", color: { light: "#a23c38", dark: "#e06060" } },
    "ff14-achievement": { label: "FF14 アチーブメント", shortLabel: "FF14", color: { light: "#a23c38", dark: "#e06060" } },
    decks: { label: "Decks", color: { light: "#a855f7", dark: "#c084fc" } },
    baseball: { label: "プロ野球", shortLabel: "野球", color: { light: "#1B5E20", dark: "#66BB6A" } },
    apps: { label: "作品", color: { light: "#6366f1", dark: "#818cf8" } },
} as const satisfies Record<string, PlatformDef>;

export type PlatformKey = keyof typeof PLATFORMS;

export function isPlatformKey(key: string): key is PlatformKey {
    return Object.prototype.hasOwnProperty.call(PLATFORMS, key);
}

/** 表示名。台帳に無いキーはキーそのまま返す (未知のデータで落とさない) */
export function platformLabel(key: string, short = false): string {
    if (!isPlatformKey(key)) return key;
    const def: PlatformDef = PLATFORMS[key];
    return (short && def.shortLabel) || def.label;
}

/** CSS 変数参照。JS から色を使うときはこれを通す (ライト/ダークは CSS 側が切り替える) */
export function platformVar(key: string): string {
    return isPlatformKey(key) ? `var(--color-${key})` : "var(--fg-muted)";
}
