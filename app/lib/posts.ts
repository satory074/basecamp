import type { Post, UnifiedPost } from "./types";

export async function getZennPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/zenn");
        if (!response.ok) {
            throw new Error("Failed to fetch posts");
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch Zenn posts:", error);
        return [];
    }
}

export async function getHatenaPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/hatena");
        if (!response.ok) {
            throw new Error("Failed to fetch posts");
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch Hatena posts:", error);
        return [];
    }
}

export async function getUnifiedPosts(): Promise<UnifiedPost[]> {
    try {
        const [hatenaResponse, zennResponse] = await Promise.all([fetch("/api/hatena"), fetch("/api/zenn")]);

        const [hatenaPosts, zennPosts] = await Promise.all([hatenaResponse.json(), zennResponse.json()]);

        const unifiedPosts: UnifiedPost[] = [
            ...hatenaPosts.map((post: any) => ({
                ...post,
                platform: "hatena",
                date: new Date(post.date),
            })),
            ...zennPosts.map((post: any) => ({
                ...post,
                platform: "zenn",
                date: new Date(post.date),
            })),
        ];

        return unifiedPosts.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
        console.error("Failed to fetch unified posts:", error);
        return [];
    }
}
