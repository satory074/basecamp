"use client";

import { TweetWithFallback, getTweetId, type XTweet } from "@/app/components/shared/TweetEmbed";
import { formatJstDateTime, formatJstTime } from "@/app/lib/shared/date-utils";

function kindLabel(post: XTweet): string {
    if (post.isRetweet || post.description?.startsWith("RT @")) return "リポスト";
    if (post.category === "like") return "いいね";
    if (post.category === "bookmark") return "ブックマーク";
    return "投稿";
}

/**
 * X は公式の埋め込み (react-tweet) のまま。種類 (投稿 / いいね / …) はアイコンだけでなく文字で出す。
 */
export default function XPostCard({ post, showDate = false }: { post: XTweet; showDate?: boolean }) {
    return (
        <article className="post post-x" data-platform="x" aria-label={`X の${kindLabel(post)}`}>
            <p className="post-meta">
                <span className="post-badge">{kindLabel(post)}</span>
                <span className="post-source">X</span>
                <time dateTime={post.date}>{showDate ? formatJstDateTime(post.date) : formatJstTime(post.date)}</time>
            </p>
            <div className="post-embed">
                <TweetWithFallback post={post} tweetId={getTweetId(post)} />
            </div>
        </article>
    );
}
