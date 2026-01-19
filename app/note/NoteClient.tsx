"use client";

import FeedPosts from "../components/FeedPosts";
import type { Post } from "../lib/types";

async function fetchNotePosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/note");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

export default function NoteClient() {
    return <FeedPosts fetchPosts={fetchNotePosts} source="Note" />;
}
