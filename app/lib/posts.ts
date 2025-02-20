import type { Post } from "./types";

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
