"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Post } from "@/app/lib/types";
import type { XTweet } from "@/app/components/shared/TweetEmbed";
import { collapseRuns, type FeedRow } from "@/app/lib/feed/collapse";
import { groupByJstDay } from "@/app/lib/feed/days";
import { platformLabel } from "@/app/lib/platforms";
import { dayKeyDiff, formatJstDayHeading } from "@/app/lib/shared/date-utils";
import PostCard from "./PostCard";
import XPostCard from "./XPostCard";
import ActivityBand from "./ActivityBand";
import { useJstToday } from "./useJstToday";

/** X の埋め込みは 1 件ごとに X から読み込むので、まとめて開かず 10 件ずつ */
const X_BATCH = 10;
const WEEKDAYS = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];

function Entry({ post }: { post: Post }) {
    return post.platform === "x" ? <XPostCard post={post as XTweet} /> : <PostCard post={post} />;
}

function RunRow({ row }: { row: Extract<FeedRow<Post>, { kind: "run" }> }) {
    const listId = useId();
    const [shown, setShown] = useState(0);
    const total = row.rest.length;
    const batch = row.platform === "x" ? X_BATCH : total;
    const allSame = row.rest.every((p) => p.title === row.head.title);
    const label = platformLabel(row.platform);
    const remaining = total - shown;

    return (
        <li className="run">
            <Entry post={row.head} />
            {/* ボタンは動かさず、開いた分をボタンの後ろに足す (押した場所が跳ねない) */}
            <button
                type="button"
                className="run-toggle"
                aria-expanded={shown > 0}
                aria-controls={listId}
                onClick={() => setShown(remaining > 0 ? Math.min(total, shown + batch) : 0)}
            >
                <svg className="run-toggle-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                    <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" />
                </svg>
                {remaining > 0
                    ? `${label} をあと ${Math.min(batch, remaining)} 件表示${allSame && shown === 0 ? "（同じ内容）" : ""}`
                    : `${label} の ${total} 件をたたむ`}
            </button>
            <ul id={listId} className="run-rest" role="list" hidden={shown === 0}>
                {row.rest.slice(0, shown).map((post) => (
                    <li key={post.id}>
                        <Entry post={post} />
                    </li>
                ))}
            </ul>
        </li>
    );
}

function DayHeading({ dayKey, today, variant, newestYear }: {
    dayKey: string;
    today: string | null;
    variant: "a" | "b";
    newestYear: number;
}) {
    const diff = today ? dayKeyDiff(today, dayKey) : null;
    const rel = diff === 0 ? "今日" : diff === 1 ? "昨日" : null;

    if (variant === "b") {
        const [y, m, d] = dayKey.split("-").map(Number);
        const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
        return (
            <h2 id={`day-${dayKey}`} className="day-heading">
                <time dateTime={dayKey}>
                    <span className="day-num">{d}</span>
                    <span className="day-rest">
                        {y !== newestYear && `${y}年`}
                        {m}月 {weekday}
                    </span>
                </time>
                {rel && <span className="day-rel">{rel}</span>}
            </h2>
        );
    }

    return (
        <h2 id={`day-${dayKey}`} className="day-heading">
            <time dateTime={dayKey}>{formatJstDayHeading(dayKey, newestYear)}</time>
            {rel && <span className="day-rel">{rel}</span>}
        </h2>
    );
}

interface FeedDaysProps {
    posts: Post[];
    variant: "a" | "b";
}

/**
 * ホームのフィード (モックアップ版)。1 日 = 1 セクション、見出しは JST の日付。
 * 同じプラットフォームの連続は collapseRuns() で畳む。検索中は畳まない (探したものを隠さない)。
 */
export default function FeedDays({ posts, variant }: FeedDaysProps) {
    const today = useJstToday();
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const searchId = useId();

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
            e.preventDefault();
            inputRef.current?.focus();
            inputRef.current?.scrollIntoView({ block: "center" });
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const needle = query.trim().toLowerCase();
    const days = useMemo(() => {
        const filtered = needle
            ? posts.filter((p) =>
                (p.title ?? "").toLowerCase().includes(needle)
                || (p.description ?? "").toLowerCase().includes(needle))
            : posts;
        return groupByJstDay(filtered);
    }, [posts, needle]);

    const newestYear = Number((days[0]?.dayKey ?? "").slice(0, 4)) || 0;
    const allDays = useMemo(() => groupByJstDay(posts), [posts]);

    return (
        <div className="feed">
            <div className="feed-search" role="search">
                <label htmlFor={searchId} className="visually-hidden">記録を検索</label>
                <svg className="feed-search-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                    <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="m10.5 10.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <input
                    ref={inputRef}
                    id={searchId}
                    type="search"
                    className="feed-search-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="記録を検索"
                    aria-describedby={`${searchId}-hint`}
                    autoComplete="off"
                />
                <p id={`${searchId}-hint`} className="feed-search-hint">
                    <kbd>/</kbd> キーでここに移動できます
                </p>
            </div>

            <p className="visually-hidden" role="status">
                {needle ? `「${query.trim()}」に一致する記録は ${days.reduce((n, d) => n + d.posts.length, 0)} 件です` : ""}
            </p>

            {needle && days.length === 0 && (
                <div className="status-box">
                    <p>「{query.trim()}」に一致する記録はありません。</p>
                    <button type="button" className="text-button" onClick={() => setQuery("")}>
                        検索をやめる
                    </button>
                </div>
            )}

            {days.map((day) => {
                const rows = needle
                    ? day.posts.map((item) => ({ kind: "item" as const, item }))
                    : collapseRuns(day.posts);
                const fullDay = allDays.find((d) => d.dayKey === day.dayKey);
                return (
                    <section key={day.dayKey} className="day" aria-labelledby={`day-${day.dayKey}`}>
                        <DayHeading dayKey={day.dayKey} today={today} variant={variant} newestYear={newestYear} />
                        {variant === "b" && fullDay && <ActivityBand posts={fullDay.posts} />}
                        <ul className="day-list" role="list">
                            {rows.map((row) =>
                                row.kind === "run" ? (
                                    <RunRow key={row.key} row={row} />
                                ) : (
                                    <li key={row.item.id}>
                                        <Entry post={row.item} />
                                    </li>
                                ),
                            )}
                        </ul>
                    </section>
                );
            })}

            {!needle && (
                <div className="feed-more">
                    <button type="button" className="button">前の日を表示</button>
                </div>
            )}
        </div>
    );
}
