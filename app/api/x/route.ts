import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Post } from "../../lib/types";

export const revalidate = 21600; // ISR: 6時間ごとに再生成

interface TweetEntry {
    id: string;
    date: string;
    category: "post" | "like";
    description?: string;
}

interface XTweetsData {
    username: string;
    tweets: TweetEntry[];
}

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), "public/data/x-tweets.json");
        const fileContent = await fs.readFile(filePath, "utf-8");
        const data: XTweetsData = JSON.parse(fileContent);

        const posts: Post[] = data.tweets.map((tweet) => ({
            id: `x-${tweet.id}`,
            title: tweet.category === "post" ? "Post" : "Like",
            url: `https://x.com/${data.username}/status/${tweet.id}`,
            date: tweet.date,
            platform: "x",
            description: tweet.description,
            category: tweet.category,
        }));

        // Sort by date, newest first
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json(posts);
    } catch (error) {
        console.error("X API error:", error);
        return NextResponse.json([]);
    }
}
