"use client";

import FeedPosts from "./FeedPosts";
import { getZennPosts } from "../lib/posts";

export default function ZennPosts() {
    return (
        <FeedPosts
            fetchPosts={getZennPosts}
            icon="📘"
            source="Zenn"
        />
    );
}
