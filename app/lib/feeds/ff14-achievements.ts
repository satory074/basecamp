import type { Post } from "../types";
import type { DiaryStat } from "../diary-types";
import { readFeedJson } from "../feed-storage";

interface FF14AchievementFeedEntry {
    id: string;
    /** アチーブメント名 (旧データは「カテゴリ「名前」を達成しました。」の文) */
    title: string;
    url: string;
    date: string;
    platform: string;
    /** 詳細ページの説明文 (未取得なら無し) */
    description?: string;
    /** バトル / クエスト / 探検 / キャラクター など */
    category?: string;
    points?: number;
    reward?: { label: string; value: string };
    thumbnail?: string;
}

interface FF14AchievementsFeedData {
    lastUpdated: string;
    totalPoints?: number;
    posts: FF14AchievementFeedEntry[];
}

const JAPANESE = /[぀-ヿ一-鿿]/;

function stats(entry: FF14AchievementFeedEntry): DiaryStat[] {
    const out: DiaryStat[] = [];
    if (entry.points !== undefined) out.push({ key: "points", icon: "", label: "", value: `${entry.points} pt` });
    // 日本版 Lodestone でも報酬の称号は英語表記で返ってくるので、日本語のもの (アイテム名など) だけ出す
    if (entry.reward && JAPANESE.test(entry.reward.value)) {
        out.push({ key: "reward", icon: "", label: entry.reward.label, value: entry.reward.value });
    }
    return out;
}

export async function getFF14AchievementPosts(): Promise<Post[]> {
    try {
        const data = await readFeedJson<FF14AchievementsFeedData>("ff14-achievements-feed.json");
        const posts: Post[] = data.posts.map((entry) => ({
            id: entry.id,
            title: entry.title,
            url: entry.url,
            date: entry.date,
            platform: "ff14-achievement" as const,
            // 旧フォーマットの description は固定文字列 "アチーブメント" なので出さない
            description: entry.description && entry.description !== "アチーブメント" ? entry.description : undefined,
            category: entry.category,
            thumbnail: entry.thumbnail,
            data: { stats: stats(entry) },
        }));
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}
