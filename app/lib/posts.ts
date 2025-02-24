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

export async function getGithubPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/github");
        if (!response.ok) {
            throw new Error("Failed to fetch GitHub repositories");
        }
        const repositories = await response.json();
        return repositories.map((repo: any) => ({
            id: repo.id,
            title: repo.name,
            url: repo.html_url,
            date: repo.updated_at,
            data: {
                description: repo.description,
            },
        }));
    } catch (error) {
        console.error("Failed to fetch GitHub repositories:", error);
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
