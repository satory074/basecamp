/**
 * プラットフォーム別の色定義
 * CSS変数 --color-{platform} と同期
 */
export const platformColors: Record<string, { dot: string; text: string; color: string }> = {
    hatena: { dot: "dot-hatena", text: "text-hatena", color: "#1a1a1a" },
    zenn: { dot: "dot-zenn", text: "text-zenn", color: "#0ea5e9" },
    github: { dot: "dot-github", text: "text-github", color: "#24292e" },
    soundcloud: { dot: "dot-soundcloud", text: "text-soundcloud", color: "#f50" },
    booklog: { dot: "dot-booklog", text: "text-booklog", color: "#4ea6cc" },
    note: { dot: "dot-note", text: "text-note", color: "#41c9b4" },
    tenhou: { dot: "dot-tenhou", text: "text-tenhou", color: "#1a1a1a" },
    ff14: { dot: "dot-ff14", text: "text-ff14", color: "#a23c38" },
    "ff14-achievement": { dot: "dot-ff14-achievement", text: "text-ff14-achievement", color: "#a23c38" },
    decks: { dot: "dot-decks", text: "text-decks", color: "#a855f7" },
    filmarks: { dot: "dot-filmarks", text: "text-filmarks", color: "#f7c600" },
    spotify: { dot: "dot-spotify", text: "text-spotify", color: "#1DB954" },
    hatenabookmark: { dot: "dot-hatenabookmark", text: "text-hatenabookmark", color: "#00A4DE" },
    x: { dot: "dot-x", text: "text-x", color: "#000000" },
    duolingo: { dot: "dot-duolingo", text: "text-duolingo", color: "#58CC02" },
    steam: { dot: "dot-steam", text: "text-steam", color: "#142048" },
    naita: { dot: "dot-naita", text: "text-naita", color: "#7B8FCE" },
    diary: { dot: "dot-diary", text: "text-diary", color: "#D97706" },
    swarm: { dot: "dot-swarm", text: "text-swarm", color: "#FFA200" },
    apps: { dot: "dot-apps", text: "text-apps", color: "#6366f1" },
};

/**
 * デフォルトの色設定
 */
export const defaultPlatformColor = { dot: "bg-gray-400", text: "", color: "#666" };
