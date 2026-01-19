/**
 * プラットフォーム別の色定義
 * CSS変数 --color-{platform} と同期
 */
export const platformColors: Record<string, { dot: string; text: string; color: string }> = {
    hatena: { dot: "dot-hatena", text: "text-hatena", color: "#f03" },
    zenn: { dot: "dot-zenn", text: "text-zenn", color: "#0ea5e9" },
    github: { dot: "dot-github", text: "text-github", color: "#333" },
    soundcloud: { dot: "dot-soundcloud", text: "text-soundcloud", color: "#f50" },
    booklog: { dot: "dot-booklog", text: "text-booklog", color: "#b45309" },
    note: { dot: "dot-note", text: "text-note", color: "#41c9b4" },
    tenhou: { dot: "dot-tenhou", text: "text-tenhou", color: "#16a34a" },
    ff14: { dot: "dot-ff14", text: "text-ff14", color: "#3b82f6" },
    decks: { dot: "dot-decks", text: "text-decks", color: "#a855f7" },
    filmarks: { dot: "dot-filmarks", text: "text-filmarks", color: "#f7c600" },
};

/**
 * デフォルトの色設定
 */
export const defaultPlatformColor = { dot: "bg-gray-400", text: "", color: "#666" };
