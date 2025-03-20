import { convertUrlToCustomSchema } from "./formatters";

export async function getSummaries(): Promise<Record<string, string>> {
    try {
        const response = await fetch("/data/summaries.json");
        if (!response.ok) {
            throw new Error(`Failed to fetch summaries: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error loading summaries:", error);
        return {};
    }
}

export async function getPostSummary(postId: string): Promise<string> {
    const summaries = await getSummaries();
    console.log("Looking for summary with postId:", postId);

    // 利用可能なサマリーIDも出力
    console.log("Available summary IDs:", Object.keys(summaries));

    // 1. まず完全一致で探す
    if (summaries[postId]) {
        console.log(`Found exact match for: ${postId}`);
        return summaries[postId];
    }

    // 2. URLの場合はカスタムスキーマに変換して検索
    let platform = "";
    if (postId.includes("github.com")) platform = "github";
    else if (postId.includes("hatenablog.com")) platform = "hatena";
    else if (postId.includes("zenn.dev")) platform = "zenn";

    if (platform) {
        const customId = convertUrlToCustomSchema(postId, platform);
        console.log(`Converted URL to custom schema: ${customId}`);
        if (summaries[customId]) {
            console.log(`Found match after conversion to custom schema: ${customId}`);
            return summaries[customId];
        }
    }

    // 3. 最後のパスコンポーネント（IDの部分）で部分一致を探す
    const idPart = postId.split("/").pop() || "";
    for (const [id, summary] of Object.entries(summaries)) {
        const schemaIdPart = id.split("/").pop() || "";
        if (idPart === schemaIdPart) {
            console.log(`Found match by ID part: ${id}`);
            return summary;
        }
    }

    console.log("No summary found for:", postId);
    return "この記事の要約はまだ生成されていません。";
}
