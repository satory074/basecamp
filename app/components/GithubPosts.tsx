"use client";

import FeedPosts from "./FeedPosts";
import { getGithubPosts } from "../lib/posts";

export default function GithubPosts() {
    return (
        <FeedPosts
            fetchPosts={getGithubPosts}
            icon="GitHub"
            source="GitHub"
        />
    );
}
