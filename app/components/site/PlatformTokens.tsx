import { PLATFORMS, type PlatformDef } from "@/app/lib/platforms";

/**
 * プラットフォーム色の CSS 変数を platforms.ts から生成して <head> に出す。
 *
 * - :root に --color-<key> (ライト) と、prefers-color-scheme: dark のときの値
 * - [data-platform="<key>"] に --platform (カードの縦線・バッジ・帯などが参照する)
 *
 * 以前は同じ色が globals.css と shared/constants.ts の 2 か所にあり、値がずれていた。
 * Tailwind の purge を通らない (動的なクラス名を消されない) のもここで出す理由。
 */
export function platformTokensCss(): string {
    const entries = Object.entries(PLATFORMS) as [string, PlatformDef][];
    const light = entries.map(([k, d]) => `--color-${k}:${d.color.light}`).join(";");
    const dark = entries.map(([k, d]) => `--color-${k}:${d.color.dark}`).join(";");
    const scopes = entries.map(([k]) => `[data-platform="${k}"]{--platform:var(--color-${k})}`).join("");
    return `:root{${light}}@media (prefers-color-scheme: dark){:root{${dark}}}${scopes}`;
}

export default function PlatformTokens() {
    return <style dangerouslySetInnerHTML={{ __html: platformTokensCss() }} />;
}
