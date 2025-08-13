import type { Post } from "./types";

interface ApiResult<T> {
    data: T | null;
    error: string | null;
}

async function fetchApi<T>(url: string): Promise<ApiResult<T>> {
    try {
        const response = await fetch(url, { next: { revalidate: 3600 } }); // 1時間ごとに再検証
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        return { data, error: null };
    } catch (error) {
        console.error(`Failed to fetch from ${url}:`, error);
        return { data: null, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function fetchAllPosts(): Promise<ApiResult<Post[]>> {
    // すべてのプラットフォームから投稿を並行取得
    const [hatenaResult, zennResult, githubResult] = await Promise.all([
        fetchApi<Post[]>("/api/hatena"),
        fetchApi<Post[]>("/api/zenn"),
        fetchApi<Post[]>("/api/github"),
    ]);

    // エラーチェック
    if (hatenaResult.error || zennResult.error || githubResult.error) {
        return {
            data: [...(hatenaResult.data || []), ...(zennResult.data || []), ...(githubResult.data || [])],
            error: [hatenaResult.error, zennResult.error, githubResult.error].filter(Boolean).join(", "),
        };
    }

    // すべての投稿を日付順に結合
    const allPosts = [...(hatenaResult.data || []), ...(zennResult.data || []), ...(githubResult.data || [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return { data: allPosts, error: null };
}

// 個別プラットフォーム用関数も残しておく
export async function fetchZennPosts(): Promise<ApiResult<Post[]>> {
    return fetchApi<Post[]>("/api/zenn");
}

export async function fetchGithubPosts(): Promise<ApiResult<Post[]>> {
    return fetchApi<Post[]>("/api/github");
}

export async function fetchHatenaPosts(): Promise<ApiResult<Post[]>> {
    return fetchApi<Post[]>("/api/hatena");
}
