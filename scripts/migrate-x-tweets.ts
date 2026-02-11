/**
 * 既存のx-tweets.jsonからFirestoreへデータを移行するスクリプト
 *
 * Usage: npx tsx scripts/migrate-x-tweets.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

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

async function migrate() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
        console.error("Missing Firebase credentials. Check .env.local");
        process.exit(1);
    }

    const app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    });

    const db = getFirestore(app);

    // Read existing JSON data
    const filePath = path.join(process.cwd(), "public/data/x-tweets.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data: XTweetsData = JSON.parse(fileContent);

    console.log(`Migrating ${data.tweets.length} tweets to Firestore...`);

    // Batch write (max 500 per batch)
    const batch = db.batch();

    for (const tweet of data.tweets) {
        const docRef = db.collection("x_tweets").doc(tweet.id);
        batch.set(docRef, {
            tweet_id: tweet.id,
            date: tweet.date,
            category: tweet.category,
            description: tweet.description || "",
            created_at: new Date().toISOString(),
        });
    }

    await batch.commit();
    console.log(`Successfully migrated ${data.tweets.length} tweets.`);

    // Verify
    const snapshot = await db.collection("x_tweets").get();
    console.log(`Firestore now has ${snapshot.size} documents in x_tweets.`);

    process.exit(0);
}

migrate().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
});
