/**
 * URLをカスタムスキーマ形式に変換する関数
 */
export function convertUrlToCustomSchema(url: string, platform: string): string {
    if (platform === "hatena" && url.includes("hatenablog.com")) {
        // https://xxx.hatenablog.com/entry/2023/04/01/123456 または
        // https://xxx.hatenablog.com/entry/数字ID の形式を処理
        const idMatch = url.match(/\/entry\/(\d+)$/) || url.match(/\/entry\/\d{4}\/\d{2}\/\d{2}\/(\d+)$/);
        if (idMatch && idMatch[1]) {
            return `hatenablog://entry/${idMatch[1]}`;
        }

        // 年月日形式の場合はそのパスを使用
        const datePathMatch = url.match(/\/entry\/(\d{4}\/\d{2}\/\d{2}\/\d+)$/);
        if (datePathMatch) {
            return `hatenablog://entry/${datePathMatch[1]}`;
        }

        // その他のパターン（最後のパスコンポーネントをIDとして使用）
        const lastPathComponent = url.split("/").pop();
        return `hatenablog://entry/${lastPathComponent}`;
    }

    if (platform === "zenn" && url.includes("zenn.dev")) {
        // https://zenn.dev/username/articles/article-id 形式を処理
        const idMatch = url.match(/\/articles\/([^\/]+)$/);
        if (idMatch && idMatch[1]) {
            return `zenn://articles/${idMatch[1]}`;
        }
    }

    if (platform === "github" && url.includes("github.com")) {
        // https://github.com/username/repo 形式を処理
        const repoPath = url.replace("https://github.com/", "");
        return `github://${repoPath}`;
    }

    return url; // 変換できない場合は元のURLを返す
}
