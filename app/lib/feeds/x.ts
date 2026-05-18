import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";

const USERNAME = "satory074";

interface TweetEntry {
    id: string;
    date: string;
    category: "post" | "like" | "bookmark";
    description?: string;
    isRetweet?: boolean;
}

interface XTweetsData {
    username: string;
    tweets: TweetEntry[];
}

function categoryToTitle(category: string): string {
    switch (category) {
        case "post":
            return "Post";
        case "like":
            return "Like";
        case "bookmark":
            return "Bookmark";
        default:
            return "Post";
    }
}

export async function getXPosts(): Promise<Post[]> {
    try {
        const data = await readFeedJson<XTweetsData>("x-tweets.json");
        const posts: Post[] = data.tweets.map((tweet) => ({
            id: `x-${tweet.id}`,
            title: categoryToTitle(tweet.category),
            url: `https://x.com/${data.username || USERNAME}/status/${tweet.id}`,
            date: tweet.date,
            platform: "x" as const,
            description: tweet.description,
            category: tweet.category,
            isRetweet: tweet.isRetweet ?? tweet.description?.startsWith("RT @") ?? false,
        }));
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}
