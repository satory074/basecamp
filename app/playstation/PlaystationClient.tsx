"use client";

import FeedPosts from "../components/FeedPosts";
import type { Post } from "../lib/types";

async function fetchPlaystationPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/playstation");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

/** トロフィー / プレイ記録 / はじめてプレイ / レベルアップ / ライブラリ追加 の時系列 */
export default function PlaystationClient() {
    return <FeedPosts fetchPosts={fetchPlaystationPosts} source="PlayStation" />;
}
