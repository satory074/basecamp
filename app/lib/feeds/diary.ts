import type { Post } from "../types";
import { readFeedJson } from "../feed-storage";
import type { DiaryFeedData } from "../diary-types";

export type {
    DiaryEntry,
    DiaryFacts,
    DiaryFactKind,
    DiaryFeedData,
    DiaryGameFact,
    DiaryHighlight,
    DiaryStat,
} from "../diary-types";

/** 日記ページのパス (trailingSlash: true なので末尾スラッシュ付き) */
export const DIARY_PAGE_PATH = "/diary/";

export async function getDiaryPosts(): Promise<Post[]> {
    try {
        const data = await readFeedJson<DiaryFeedData>("diary-feed.json");
        const posts: Post[] = (data.entries ?? []).map((entry) => {
            if (entry.version === 2) {
                return {
                    id: entry.id,
                    title: entry.headline || entry.title,
                    url: DIARY_PAGE_PATH,
                    date: entry.date,
                    platform: "diary",
                    description: entry.content,
                    thumbnail: entry.thumbnail,
                    category: entry.empty ? "empty" : "day",
                    data: { version: 2, stats: entry.stats ?? [] },
                };
            }
            return {
                id: entry.id,
                title: entry.title,
                url: "#",
                date: entry.date,
                platform: "diary",
                description: entry.content,
            };
        });
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return posts;
    } catch {
        return [];
    }
}
