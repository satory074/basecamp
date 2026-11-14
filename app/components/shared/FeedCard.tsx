import type { CSSProperties, ReactNode } from "react";
import { formatJstDateTime, formatJstTime } from "@/app/lib/shared/date-utils";
import { Thumbnail } from "@/app/components/shared/Thumbnail";

export interface FeedCardProps {
    href: string;
    platform: string;
    platformLabel: string;
    date: string;
    /** 時刻を出さない (Swarm は時刻を公開しない。日記・野球は代表時刻でしかない) */
    dateOnly?: boolean;
    badge?: { label: string; color?: string };
    thumbnail?: { src?: string; shape?: "square" | "portrait"; alt: string };
    title: string;
    description?: string;
    descriptionClamped?: boolean;
    metaPills?: ReactNode;
    statPills?: ReactNode;
}

interface FeedCardViewProps extends FeedCardProps {
    /** "time" = 日付見出しの下 (HH:mm だけ)、"datetime" = 単独の一覧 (日付も出す) */
    timeFormat?: "time" | "datetime";
}

/**
 * 投稿 1 件のカード。全プラットフォーム共通の形 (X だけは公式埋め込み)。
 *
 * - <article> の中で、見出しのリンク 1 本を ::after でカード全体に広げる (タブ移動 1 回)。
 *   以前は <article tabIndex=0> + 内側の <a> で 1 枚につき 2 回止まっていた。
 * - 時刻は JST の絶対表記を <time> で出す。「N時間前」はビルド時刻で固まり、ブラウザでの
 *   再描画と食い違ってハイドレーションエラーになっていた。
 * - サイト内のページ (/diary/ など) は同じタブで開く。外部だけ新しいタブ。
 * - 色はカードの data-platform から CSS が --platform として拾う (site.css の .post)。
 */
export function FeedCard({
    href,
    platform,
    platformLabel,
    date,
    dateOnly = false,
    badge,
    thumbnail,
    title,
    description,
    descriptionClamped = true,
    metaPills,
    statPills,
    timeFormat = "datetime",
}: FeedCardViewProps) {
    const external = /^https?:\/\//.test(href);
    const time = dateOnly
        ? timeFormat === "datetime" ? formatJstDateTime(date, true) : ""
        : timeFormat === "datetime" ? formatJstDateTime(date) : formatJstTime(date);

    return (
        <article className="post" data-platform={platform}>
            {thumbnail && <Thumbnail src={thumbnail.src} shape={thumbnail.shape ?? "square"} />}
            <div className="post-body">
                <h3 className="post-title">
                    <a
                        className="card-link"
                        href={href}
                        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                        {title}
                        {external && <span className="visually-hidden">（新しいタブで開く）</span>}
                    </a>
                </h3>
                <p className="post-meta">
                    {badge && (
                        <span
                            className="post-badge"
                            style={badge.color ? ({ "--badge-color": badge.color } as CSSProperties) : undefined}
                        >
                            {badge.label}
                        </span>
                    )}
                    <span className="post-source">{platformLabel}</span>
                    {time && <time dateTime={date}>{time}</time>}
                </p>
                {description && (
                    <p className="post-desc" data-clamp={descriptionClamped ? "" : undefined}>
                        {description}
                    </p>
                )}
                {statPills && <div className="post-stats">{statPills}</div>}
                {metaPills}
            </div>
        </article>
    );
}
