"use client";

import FeedPosts from "./FeedPosts";

// BooklogのAPIデータを取得する関数
async function getBooklogPosts() {
    const response = await fetch("/api/booklog");
    if (!response.ok) {
        throw new Error("Failed to fetch booklog posts");
    }
    return response.json();
}

export default function BooklogPosts() {
    return (
        <FeedPosts
            fetchPosts={getBooklogPosts}
            icon="📚"
            source="Booklog"
        />
    );
}