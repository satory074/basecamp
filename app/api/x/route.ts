import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Post } from "../../lib/types";

export const revalidate = 21600; // ISR: 6時間ごとに再生成

const USERNAME = "satory074";

interface TweetEntry {
    id: string;
    date: string;
    category: "post" | "like" | "bookmark";
    description?: string;
}

interface XTweetsData {
    username: string;
    tweets: TweetEntry[];
}

function categoryToTitle(category: string): string {
    switch (category) {
        case "post": return "Post";
        case "like": return "Like";
        case "bookmark": return "Bookmark";
        default: return "Post";
    }
}

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), "public/data/x-tweets.json");
        const fileContent = await fs.readFile(filePath, "utf-8");
        const data: XTweetsData = JSON.parse(fileContent);

        const posts: Post[] = data.tweets.map((tweet) => ({
            id: `x-${tweet.id}`,
            title: categoryToTitle(tweet.category),
            url: `https://x.com/${data.username || USERNAME}/status/${tweet.id}`,
            date: tweet.date,
            platform: "x",
            description: tweet.description,
            category: tweet.category,
        }));

        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return NextResponse.json(posts);
    } catch (error) {
        console.error("X API error:", error);
        return NextResponse.json([]);
    }
}
