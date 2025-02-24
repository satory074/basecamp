import { feedLoader } from "@ascorbic/feed-loader";
import { defineCollection, z } from "astro:content";

// 共通のスキーマ定義
const basePostSchema = z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string().optional(),
    link: z.string().url(),
    tags: z.array(z.string()).optional(),
});

// 各プラットフォーム用のコレクション定義
export const collections = {
    zenn: defineCollection({
        type: "data",
        loader: feedLoader({
            url: "https://zenn.dev/your-username/feed",
            schema: basePostSchema.extend({
                platform: z.literal("zenn"),
            }),
        }),
    }),

    qiita: defineCollection({
        type: "data",
        loader: feedLoader({
            url: "https://qiita.com/your-username/feed",
            schema: basePostSchema.extend({
                platform: z.literal("qiita"),
            }),
        }),
    }),

    // ローカルブログ用
    blog: defineCollection({
        type: "content",
        schema: basePostSchema.extend({
            platform: z.literal("blog"),
            draft: z.boolean().default(false),
        }),
    }),
};
