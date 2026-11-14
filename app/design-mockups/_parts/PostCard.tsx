import type { CSSProperties } from "react";
import type { Post } from "@/app/lib/types";
import { adaptPost } from "@/app/components/shared/feedCardAdapters";
import { platformLabel } from "@/app/lib/platforms";
import { formatJstDateTime, formatJstTime } from "@/app/lib/shared/date-utils";
import PostThumb from "./PostThumb";

interface PostCardProps {
    post: Post;
    /** "time" = 日付見出しの下 (HH:mm だけ)、"datetime" = 単独の一覧 (日付も出す) */
    timeFormat?: "time" | "datetime";
}

/**
 * 投稿 1 件のカード。
 *
 * - <article> の中で、見出しのリンク 1 本を ::after でカード全体に広げる (タブ移動 1 回)。
 *   以前は <article tabIndex=0> + 内側の <a> で 1 枚につき 2 回止まっていた。
 * - 時刻は JST の絶対表記を <time> で出す。「N時間前」はビルド時刻で固まるのでやめた。
 * - サイト内のページ (/diary/ など) は同じタブで開く。外部だけ新しいタブ。
 * - 中身 (バッジ・ピル・説明の出し分け) は既存の adaptPost() をそのまま使う。
 */
export default function PostCard({ post, timeFormat = "time" }: PostCardProps) {
    const card = adaptPost(post, post.platform);
    const external = /^https?:\/\//.test(card.href);
    // 日記は 23:59 固定、野球は 22:00 固定の代表時刻なので時刻を出さない (Swarm は時刻を公開しない)
    const hideTime = card.dateOnly || post.platform === "diary";
    const time = hideTime
        ? timeFormat === "datetime" ? formatJstDateTime(card.date, true) : ""
        : timeFormat === "datetime" ? formatJstDateTime(card.date) : formatJstTime(card.date);

    return (
        <article className="post" data-platform={post.platform}>
            {card.thumbnail && (
                <PostThumb src={card.thumbnail.src} shape={card.thumbnail.shape ?? "square"} />
            )}
            <div className="post-body">
                <h3 className="post-title">
                    <a
                        className="card-link"
                        href={card.href}
                        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                        {card.title}
                        {external && <span className="visually-hidden">（新しいタブで開く）</span>}
                    </a>
                </h3>
                <p className="post-meta">
                    {card.badge && (
                        <span
                            className="post-badge"
                            style={card.badge.color ? ({ "--badge-color": card.badge.color } as CSSProperties) : undefined}
                        >
                            {card.badge.label}
                        </span>
                    )}
                    <span className="post-source">{platformLabel(post.platform)}</span>
                    {time && <time dateTime={card.date}>{time}</time>}
                </p>
                {card.description && (
                    <p className="post-desc" data-clamp={card.descriptionClamped ? "" : undefined}>
                        {card.description}
                    </p>
                )}
                {card.statPills && <div className="post-stats">{card.statPills}</div>}
                {card.metaPills}
            </div>
        </article>
    );
}
