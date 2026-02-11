import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getFirestoreDb } from "../../lib/firebase-admin";
import type { Post } from "../../lib/types";

export const revalidate = 60; // ISR: 1分ごとに再生成

const USERNAME = "satory074";

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

interface FirestoreTweet {
    tweet_id: string;
    date: string;
    category: "post" | "like";
    description?: string;
}

async function fetchFromFirestore(): Promise<Post[]> {
    const db = getFirestoreDb();
    if (!db) return [];

    const snapshot = await db
        .collection("x_tweets")
        .orderBy("date", "desc")
        .get();

    return snapshot.docs.map((doc) => {
        const data = doc.data() as FirestoreTweet;
        return {
            id: `x-${data.tweet_id}`,
            title: data.category === "post" ? "Post" : "Like",
            url: `https://x.com/${USERNAME}/status/${data.tweet_id}`,
            date: data.date,
            platform: "x",
            description: data.description,
            category: data.category,
        };
    });
}

async function fetchFromJsonFallback(): Promise<Post[]> {
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

    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return posts;
}

export async function GET() {
    try {
        // Firestoreからの取得を試みる
        const posts = await fetchFromFirestore();
        if (posts.length > 0) {
            return NextResponse.json(posts);
        }

        // Firestoreが空または接続失敗時はJSONファイルにフォールバック
        console.warn("Firestore returned empty, falling back to JSON file");
        const fallbackPosts = await fetchFromJsonFallback();
        return NextResponse.json(fallbackPosts);
    } catch (error) {
        console.error("X API error:", error);

        // Firestoreエラー時もJSONファイルにフォールバック
        try {
            const fallbackPosts = await fetchFromJsonFallback();
            return NextResponse.json(fallbackPosts);
        } catch {
            return NextResponse.json([]);
        }
    }
}
