/**
 * HTMLタグを除去してプレーンテキストを取得
 * @param html - HTMLを含む文字列
 * @returns タグを除去したプレーンテキスト
 */
export function stripHtmlTags(html?: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * HTMLコンテンツからサムネイル画像URLを抽出
 * @param content - HTMLコンテンツ
 * @returns 最初に見つかった画像のURL、または undefined
 */
export function extractThumbnailFromContent(content?: string): string | undefined {
    if (!content) return undefined;
    // 属性順序に依存しない堅牢な正規表現
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    return imgMatch ? imgMatch[1] : undefined;
}
