"use client";

import FeedPosts from "./FeedPosts";
import PlatformDashboard from "./dashboard/PlatformDashboard";
import type { Post } from "../lib/types";

// BooklogのAPIデータを取得する関数
async function getBooklogPosts() {
    const response = await fetch("/api/booklog");
    if (!response.ok) {
        throw new Error("Failed to fetch booklog posts");
    }
    return response.json();
}

function renderBooklogDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    const done = posts.filter((p) => (p as Post & { status?: string }).status === "read").length;
    const reading = posts.filter((p) => (p as Post & { status?: string }).status === "reading").length;
    const tbr = posts.filter((p) => (p as Post & { status?: string }).status === "want_to_read").length;

    return (
        <PlatformDashboard
            platform="booklog"
            stats={[
                { label: "読了", value: done },
                { label: "読書中", value: reading },
                { label: "積読", value: tbr },
                { label: "総冊数", value: posts.length },
            ]}
        />
    );
}

export default function BooklogPosts() {
    return (
        <FeedPosts
            fetchPosts={getBooklogPosts}
            icon="📚"
            source="Booklog"
            renderDashboard={renderBooklogDashboard}
        />
    );
}