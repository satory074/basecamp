import type { Post } from "./types";
import { fetchZennPosts, fetchGithubPosts, fetchHatenaPosts, fetchNotePosts } from "./api";

export async function getZennPosts(): Promise<Post[]> {
    const { data, error } = await fetchZennPosts();
    if (error || !data) {
        console.error("Failed to fetch Zenn posts:", error);
        return [];
    }
    return data;
}

export async function getGithubPosts(): Promise<Post[]> {
    const { data, error } = await fetchGithubPosts();
    if (error || !data) {
        console.error("Failed to fetch GitHub repositories:", error);
        return [];
    }
    return data;
}

export async function getHatenaPosts(): Promise<Post[]> {
    const { data, error } = await fetchHatenaPosts();
    if (error || !data) {
        console.error("Failed to fetch Hatena posts:", error);
        return [];
    }
    return data;
}

export async function getNotePosts(): Promise<Post[]> {
    const { data, error } = await fetchNotePosts();
    if (error || !data) {
        console.error("Failed to fetch Note posts:", error);
        return [];
    }
    return data;
}
