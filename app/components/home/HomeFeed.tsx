"use client";

import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Post } from "@/app/lib/types";
import type { XTweet } from "@/app/components/shared/TweetEmbed";
import { RichFeedCard } from "@/app/components/shared/RichFeedCard";
import XPostCard from "@/app/components/feed/XPostCard";
import ActivityBand from "@/app/components/feed/ActivityBand";
import { useJstToday } from "@/app/components/feed/useJstToday";
import { useLazyFeed } from "@/app/components/feed/useLazyFeed";
import { collapseRuns, type FeedRow } from "@/app/lib/feed/collapse";
import { INITIAL_DAYS, groupByJstDay } from "@/app/lib/feed/days";
import { platformLabel } from "@/app/lib/platforms";
import { dayKeyDiff } from "@/app/lib/shared/date-utils";

/** X の埋め込みは 1 件ごとに X から読み込むので、畳んだ分を開くときも 10 件ずつ */
const X_BATCH = 10;
const WEEKDAYS = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];

const noop = () => () => {};
function readUrlQuery(): string {
    return new URLSearchParams(window.location.search).get("q") ?? "";
}

function Entry({ post }: { post: Post }) {
    return post.platform === "x"
        ? <XPostCard post={post as XTweet} />
        : <RichFeedCard post={post} platform={post.platform} timeFormat="time" />;
}

/** 同じプラットフォームの連続。先頭 1 件 + 開閉ボタン、開いた分はボタンの後ろに足す (押した場所が動かない) */
function RunRow({ row }: { row: Extract<FeedRow<Post>, { kind: "run" }> }) {
    const listId = useId();
    const [shown, setShown] = useState(0);
    const total = row.rest.length;
    const batch = row.platform === "x" ? X_BATCH : total;
    const remaining = total - shown;
    const allSame = row.rest.every((p) => p.title === row.head.title);
    const label = platformLabel(row.platform);

    return (
        <li className="run">
            <Entry post={row.head} />
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

function DayHeading({ dayKey, today, newestYear }: { dayKey: string; today: string | null; newestYear: number }) {
    const [y, m, d] = dayKey.split("-").map(Number);
    const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    // 「今日 / 昨日」はブラウザでだけ付ける (静的 HTML はビルド時点の日付で固まるため)
    const diff = today ? dayKeyDiff(today, dayKey) : null;
    const rel = diff === 0 ? "今日" : diff === 1 ? "昨日" : null;
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

interface HomeFeedProps {
    /** 直近 INITIAL_DAYS 日分 (HTML に埋め込む) */
    initialPosts: Post[];
    totalCount: number;
    totalDays: number;
    /** 続きの静的 JSON。新しい順 (直近 → それより前) */
    sources: readonly string[];
}

/**
 * ホームのフィード。1 日 = 1 セクション (見出しは JST の日付 + その日の活動の帯)。
 *
 * - 同じプラットフォームが 3 件以上続いたら畳む (collapseRuns)。検索中は畳まない
 * - 4 日目より前は直近分の JSON を、検索と 30 日より前は残りの JSON も読んでから出す
 * - 自動で次の日を読むが、同じ働きのボタンも置く (キーボード操作と、フッターに辿り着くため)
 */
export default function HomeFeed({ initialPosts, totalCount, totalDays, sources }: HomeFeedProps) {
    const today = useJstToday();
    const full = useLazyFeed(sources);
    const { ensure } = full;
    const posts = full.posts ?? initialPosts;

    // ?q= は最初の表示でだけ URL から読む。以後は入力が優先 (URL は入力に合わせて書き換える)
    const urlQuery = useSyncExternalStore(noop, readUrlQuery, () => "");
    const [typed, setTyped] = useState<string | null>(null);
    const query = typed ?? urlQuery;
    const deferredQuery = useDeferredValue(query);
    const needle = deferredQuery.trim().toLowerCase();

    const [visibleDays, setVisibleDays] = useState(INITIAL_DAYS);
    const [announcement, setAnnouncement] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const urlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchId = useId();

    // URL に検索語が付いて開かれたら、全件を読んでおく
    useEffect(() => {
        if (urlQuery) ensure();
    }, [urlQuery, ensure]);

    const filtered = useMemo(() => {
        if (!needle) return posts;
        return posts.filter((p) =>
            (p.title ?? "").toLowerCase().includes(needle)
            || (p.description ?? "").toLowerCase().includes(needle));
    }, [posts, needle]);

    const allDays = useMemo(() => groupByJstDay(posts), [posts]);
    const days = useMemo(() => groupByJstDay(filtered), [filtered]);
    const shownDays = days.slice(0, visibleDays);
    const newestYear = Number((allDays[0]?.dayKey ?? "").slice(0, 4)) || 0;
    const knownDays = full.complete || needle ? days.length : totalDays;
    const hasMore = visibleDays < knownDays;
    const searchingAll = needle !== "" && !full.complete;

    const showMore = useCallback(() => {
        // 埋め込み分を出し切ったら全件を読む。読み終えるまでは日数を増やさない
        // (番兵は読み込み後に描き直されて再び交差し、そこで次の日が出る)
        if (visibleDays >= days.length && !full.complete) {
            ensure(full.loadedCount + 1);
            return;
        }
        const next = days[visibleDays];
        setVisibleDays((n) => n + 1);
        if (next) setAnnouncement(`${next.dayKey.replace(/-/g, "/")} の ${next.posts.length} 件を表示しました`);
    }, [days, ensure, full.complete, full.loadedCount, visibleDays]);

    // 番兵が見えたら次の日を足す
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasMore) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) showMore();
        }, { rootMargin: "400px 0px" });
        io.observe(el);
        return () => io.disconnect();
    }, [hasMore, showMore]);

    // "/" で検索欄へ
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

    const onQueryChange = (value: string) => {
        setTyped(value);
        setVisibleDays(INITIAL_DAYS);
        if (value) ensure();
        // URL の ?q= を少し遅れて合わせる (Next に再取得させないよう History API を直接使う)
        if (urlTimer.current) clearTimeout(urlTimer.current);
        urlTimer.current = setTimeout(() => {
            const url = value ? `${window.location.pathname}?q=${encodeURIComponent(value)}` : window.location.pathname;
            window.history.replaceState(window.history.state, "", url);
        }, 300);
    };

    const matchCount = needle ? filtered.length : 0;

    return (
        <section className="feed" aria-labelledby="feed-heading">
            <h2 id="feed-heading" className="visually-hidden">最近の記録</h2>
            <a href="#site-footer" className="skip-to-content">記録を飛ばしてページの最後へ</a>

            <div className="search-box" role="search">
                <label htmlFor={searchId} className="visually-hidden">記録を検索</label>
                <svg className="search-box-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                    <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="m10.5 10.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <input
                    ref={inputRef}
                    id={searchId}
                    type="search"
                    className="search-box-input"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    onFocus={() => ensure()}
                    placeholder={`${totalCount.toLocaleString("ja-JP")} 件の記録を検索`}
                    aria-describedby={`${searchId}-hint`}
                    autoComplete="off"
                />
                <p id={`${searchId}-hint`} className="search-box-hint">
                    <kbd>/</kbd> キーでここに移動できます
                </p>
            </div>

            <p className="visually-hidden" role="status">
                {needle && !searchingAll ? `「${deferredQuery.trim()}」に一致する記録は ${matchCount} 件です` : announcement}
            </p>

            {searchingAll && <p className="status-box">すべての記録を読み込んでから検索しています…</p>}

            {needle && !searchingAll && matchCount === 0 && (
                <div className="status-box">
                    <p>「{deferredQuery.trim()}」に一致する記録はありません。</p>
                    <button type="button" className="text-button" onClick={() => onQueryChange("")}>
                        検索をやめる
                    </button>
                </div>
            )}

            {shownDays.map((day) => {
                const rows: FeedRow<Post>[] = needle
                    ? day.posts.map((item) => ({ kind: "item", item }))
                    : collapseRuns(day.posts);
                const fullDay = allDays.find((d) => d.dayKey === day.dayKey);
                return (
                    <section key={day.dayKey} className="day" aria-labelledby={`day-${day.dayKey}`}>
                        <DayHeading dayKey={day.dayKey} today={today} newestYear={newestYear} />
                        {!needle && fullDay && <ActivityBand posts={fullDay.posts} />}
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

            {full.status === "error" && (
                <div className="status-box" role="alert">
                    <p>前の日の記録を読み込めませんでした。通信状態を確かめて、もう一度お試しください。</p>
                    <button type="button" className="text-button" onClick={() => ensure(full.loadedCount + 1)}>もう一度読み込む</button>
                </div>
            )}

            {hasMore ? (
                <div ref={sentinelRef} className="feed-more">
                    <button type="button" className="button" onClick={showMore} aria-busy={full.status === "loading"}>
                        {full.status === "loading" ? "読み込んでいます…" : "前の日を表示"}
                    </button>
                </div>
            ) : (
                shownDays.length > 0 && <p className="feed-end">ここが最初の記録です。</p>
            )}
        </section>
    );
}
