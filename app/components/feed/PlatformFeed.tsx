"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Post } from "@/app/lib/types";
import type { XTweet } from "@/app/components/shared/TweetEmbed";
import { RichFeedCard } from "@/app/components/shared/RichFeedCard";
import FilterChips, { type FilterOption } from "@/app/components/shared/FilterChips";
import { FeedStatus } from "@/app/components/site/SiteChrome";
import XPostCard from "./XPostCard";
import { useLazyFeed } from "./useLazyFeed";

const ALL = "all";

interface PlatformFeedProps {
    platform: string;
    /** 最初の 1 ページ分。サーバーで描画して HTML に入れる (読み込み中の表示を出さない) */
    initialPosts: Post[];
    totalCount: number;
    /** 全件の静的 JSON (/api/<platform>)。2 ページ目以降・絞り込みのときだけ読む */
    src: string;
    pageSize?: number;
    /** 絞り込み (例: ブクログの読書状態)。件数はサーバーで数えて渡す。先頭に「すべて」が付く */
    filters?: {
        label: string;
        field: "description" | "category";
        options: FilterOption[];
    };
}

/**
 * プラットフォームページの投稿一覧。
 *
 * 以前の FeedPosts は、ビルド時に作った静的 JSON をブラウザで読み直してから描いていたので、
 * 毎回「読み込み中…」が出ていた。最初の 1 ページはサーバーで描画し、続きだけを読む。
 */
export default function PlatformFeed({ platform, initialPosts, totalCount, src, pageSize = 20, filters }: PlatformFeedProps) {
    const [sources] = useState(() => [src]);
    const lazy = useLazyFeed(sources);
    const { ensure } = lazy;
    const posts = lazy.posts ?? initialPosts;
    const [selected, setSelected] = useState(ALL);
    const [visibleCount, setVisibleCount] = useState(initialPosts.length);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const filtering = filters !== undefined && selected !== ALL;
    // 絞り込みは全件がそろってからでないと数が合わない
    const waitingForAll = filtering && !lazy.complete;
    const shown = filtering
        ? posts.filter((p) => p[filters.field] === selected)
        : posts;
    const expectedTotal = filtering
        ? filters.options.find((o) => o.key === selected)?.count ?? shown.length
        : totalCount;
    const total = lazy.complete ? shown.length : expectedTotal;
    const hasMore = !waitingForAll && visibleCount < total;

    const showMore = useCallback(() => {
        if (visibleCount >= shown.length && !lazy.complete) {
            ensure();
            return;
        }
        setVisibleCount((n) => n + pageSize);
    }, [ensure, lazy.complete, pageSize, shown.length, visibleCount]);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasMore) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) showMore();
        }, { rootMargin: "400px 0px" });
        io.observe(el);
        return () => io.disconnect();
    }, [hasMore, showMore]);

    if (totalCount === 0) return <FeedStatus kind="empty" />;

    const onToggle = (key: string) => {
        const next = key === selected ? ALL : key;
        setSelected(next);
        setVisibleCount(pageSize);
        if (next !== ALL) ensure();
    };

    return (
        <section className="platform-feed" aria-label="記録の一覧">
            {filters && (
                <FilterChips
                    label={filters.label}
                    options={[{ key: ALL, label: "すべて", count: totalCount }, ...filters.options]}
                    selected={[selected]}
                    onToggle={onToggle}
                />
            )}
            <p className="visually-hidden" role="status">
                {filtering && !waitingForAll ? `${total} 件を表示しています` : ""}
            </p>

            {waitingForAll ? (
                lazy.status === "error"
                    ? <FeedStatus kind="error" onRetry={() => ensure()} />
                    : <FeedStatus kind="loading" />
            ) : (
                <ul className="day-list" role="list">
                    {shown.slice(0, visibleCount).map((post) => (
                        <li key={post.id}>
                            {platform === "x"
                                ? <XPostCard post={post as XTweet} showDate />
                                : <RichFeedCard post={post} platform={platform} timeFormat="datetime" />}
                        </li>
                    ))}
                </ul>
            )}

            {!waitingForAll && lazy.status === "error" && <FeedStatus kind="error" onRetry={() => ensure()} />}
            {hasMore && (
                <div ref={sentinelRef} className="feed-more">
                    <button type="button" className="button" onClick={showMore} aria-busy={lazy.status === "loading"}>
                        {lazy.status === "loading"
                            ? "読み込んでいます…"
                            : `さらに表示（残り ${(total - visibleCount).toLocaleString("ja-JP")} 件）`}
                    </button>
                </div>
            )}
        </section>
    );
}
