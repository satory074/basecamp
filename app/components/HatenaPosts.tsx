"use client";

import FeedPosts from "./FeedPosts";
import { getHatenaPosts } from "../lib/posts";

export default function HatenaPosts() {
    return (
        <FeedPosts
            fetchPosts={getHatenaPosts}
            icon="📝"
            source="Hatena"
        />
    );
}
