"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Post } from "../lib/types";
import { RichFeedCard } from "@/app/components/shared/RichFeedCard";
import { TweetWithFallback, CategoryBadge, getTweetId } from "@/app/components/shared/TweetEmbed";
import type { XTweet } from "@/app/components/shared/TweetEmbed";
import { DonutChart } from "@/app/components/charts";
import type { BarDatum } from "@/app/components/charts/BarChart";
import type { DonutSlice } from "@/app/components/charts/DonutChart";
import SearchBar from "./SearchBar";

const POSTS_PER_PAGE = 20;

interface ContentItem extends Post {
    platform: string;
}

interface HomeFeedProps {
    initialPosts: ContentItem[];
    dashboardStats?: { label: string; value: string | number }[];
    platformActivity?: BarDatum[];
}

/** 日付ラベルを生成（「今日」「昨日」「3月23日」「2024年3月23日」等） */
function getDateLabel(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const postDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.floor((today.getTime() - postDay.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "今日";
        if (diffDays === 1) return "昨日";
        if (date.getFullYear() !== now.getFullYear()) {
            return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        }
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    } catch {
        return "";
    }
}

/** ツイート高さ制限ラッパー — overflowしている場合のみフェードを表示 */
function TweetConstrained({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const [overflowing, setOverflowing] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const check = () => setOverflowing(el.scrollHeight > el.clientHeight);
        check();
        const observer = new ResizeObserver(check);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`tweet-constrained${overflowing ? " tweet-overflowing" : ""}`}
        >
            {children}
        </div>
    );
}

export default function HomeFeed({ initialPosts, platformActivity }: HomeFeedProps) {
    const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [chartOpen, setChartOpen] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [loadAnnouncement, setLoadAnnouncement] = useState("");
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const prevVisibleCountRef = useRef(POSTS_PER_PAGE);

    // Hydrate query from URL (?q=...) on mount — client only.
    useEffect(() => {
        const sp = new URLSearchParams(window.location.search);
        const q = sp.get("q") ?? "";
        if (q) {
            setQuery(q);
            setDebouncedQuery(q);
        }
    }, []);

    // Debounce filtering itself (keeps IME-typing snappy on slower devices).
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 150);
        return () => clearTimeout(t);
    }, [query]);

    // Persist query to URL (debounced); use raw History API so Next does not
    // refetch the RSC payload on every keystroke.
    useEffect(() => {
        const t = setTimeout(() => {
            const sp = new URLSearchParams();
            if (query) sp.set("q", query);
            const qs = sp.toString();
            const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
            window.history.replaceState({}, "", url);
        }, 300);
        return () => clearTimeout(t);
    }, [query]);

    const filteredPosts = useMemo(() => {
        if (!debouncedQuery) return initialPosts;
        const needle = debouncedQuery.toLowerCase();
        return initialPosts.filter(p =>
            (p.title ?? "").toLowerCase().includes(needle)
            || (p.description ?? "").toLowerCase().includes(needle)
        );
    }, [initialPosts, debouncedQuery]);

    const visiblePosts = useMemo(
        () => filteredPosts.slice(0, visibleCount),
        [filteredPosts, visibleCount]
    );

    const platformDonutSlices: DonutSlice[] = useMemo(
        () => (platformActivity ?? []).map((d) => ({
            label: d.label,
            value: d.value,
            color: d.color ?? "#888888",
        })),
        [platformActivity]
    );

    const hasMore = visibleCount < filteredPosts.length;

    // Reset pagination whenever the search edits the result set.
    useEffect(() => {
        setVisibleCount(POSTS_PER_PAGE);
        prevVisibleCountRef.current = POSTS_PER_PAGE;
    }, [debouncedQuery]);

    // Announce newly-loaded items to screen readers.
    useEffect(() => {
        const prev = prevVisibleCountRef.current;
        const added = visibleCount - prev;
        if (added > 0 && prev !== POSTS_PER_PAGE) {
            setLoadAnnouncement(`${added}件追加されました`);
            const t = setTimeout(() => setLoadAnnouncement(""), 1500);
            prevVisibleCountRef.current = visibleCount;
            return () => clearTimeout(t);
        }
        prevVisibleCountRef.current = visibleCount;
    }, [visibleCount]);

    // Infinite scroll
    useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsLoadingMore(true);
                    setVisibleCount(prev => Math.min(prev + POSTS_PER_PAGE, filteredPosts.length));
                    // Reset busy flag after the next paint.
                    requestAnimationFrame(() => setIsLoadingMore(false));
                }
            },
            { rootMargin: '100px' }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, filteredPosts.length]);

    // Back to top visibility
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 600);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // "/" focuses search (when not already typing in another field).
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key !== "/") return;
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
            e.preventDefault();
            searchInputRef.current?.focus();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleClearSearch = useCallback(() => {
        setQuery("");
    }, []);

    // Build posts with date separators; track the post's index in
    // filteredPosts (1-based) for aria-posinset.
    const postsWithSeparators = useMemo(() => {
        const result: { type: "post" | "separator"; post?: ContentItem; label?: string; posInSet?: number }[] = [];
        let lastDateLabel = "";

        visiblePosts.forEach((post, idx) => {
            const dateLabel = getDateLabel(post.date);
            if (dateLabel && dateLabel !== lastDateLabel) {
                result.push({ type: "separator", label: dateLabel });
                lastDateLabel = dateLabel;
            }
            result.push({ type: "post", post, posInSet: idx + 1 });
        });
        return result;
    }, [visiblePosts]);

    const totalCount = filteredPosts.length;
    const showProgress = totalCount > 0;

    return (
        <div>
            {/* Skip link — first focusable, jumps to footer to escape infinite scroll */}
            <a href="#site-footer" className="sr-only-focusable">
                フィードをスキップしてフッタへ
            </a>

            {/* Sticky search + progress */}
            <div className="feed-controls">
                <SearchBar
                    ref={searchInputRef}
                    value={query}
                    onSearch={setQuery}
                    placeholder="投稿を検索... ( / でフォーカス)"
                />
                {showProgress && (
                    <div className="feed-progress" aria-live="polite" aria-atomic="false">
                        {visiblePosts.length} / {totalCount}件
                        {debouncedQuery && <span className="feed-progress-query"> · 「{debouncedQuery}」</span>}
                    </div>
                )}
            </div>

            {/* Live region for newly-loaded items (visually hidden) */}
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {loadAnnouncement}
            </div>

            {/* Collapsible chart */}
            {platformActivity && platformActivity.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                    <button
                        className="collapsible-toggle"
                        onClick={() => setChartOpen(prev => !prev)}
                    >
                        <span className={`collapsible-toggle-icon ${chartOpen ? "open" : ""}`}>
                            ▶
                        </span>
                        プラットフォーム比率（直近72時間）
                    </button>
                    {chartOpen && (
                        <DonutChart
                            slices={platformDonutSlices}
                            centerLabel={String(platformActivity.reduce((s, d) => s + d.value, 0))}
                            centerSubLabel="件"
                        />
                    )}
                </div>
            )}

            {/* Empty state (only meaningful while searching) */}
            {filteredPosts.length === 0 && debouncedQuery && (
                <div className="feed-empty">
                    <p>「{debouncedQuery}」に一致する投稿がありません</p>
                    <button className="filter-chip" onClick={handleClearSearch}>
                        検索をクリア
                    </button>
                </div>
            )}

            {/* Feed: WAI-ARIA Feed Pattern */}
            <section
                role="feed"
                aria-busy={isLoadingMore}
                aria-labelledby="recent-posts-heading"
            >
                {postsWithSeparators.map((item, idx) => {
                    if (item.type === "separator") {
                        return (
                            <div key={`sep-${item.label}-${idx}`} className="date-separator" role="presentation">
                                <span className="date-separator-label">{item.label}</span>
                                <div className="date-separator-line" />
                            </div>
                        );
                    }

                    const post = item.post!;
                    const posInSet = item.posInSet!;

                    if (post.platform === "x") {
                        const xPost = post as ContentItem & XTweet;
                        return (
                            <article
                                key={post.id || idx}
                                className="feed-item platform-x feed-item-featured"
                                role="article"
                                tabIndex={0}
                                aria-posinset={posInSet}
                                aria-setsize={totalCount}
                                style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}
                            >
                                <CategoryBadge post={xPost} />
                                <TweetConstrained>
                                    <TweetWithFallback post={xPost} tweetId={getTweetId(xPost)} />
                                </TweetConstrained>
                            </article>
                        );
                    }

                    return (
                        <RichFeedCard
                            key={post.id || idx}
                            post={post}
                            platform={post.platform}
                            posInSet={posInSet}
                            setSize={totalCount}
                        />
                    );
                })}
            </section>

            {hasMore ? (
                <div
                    ref={loadMoreRef}
                    className="load-more-sentinel"
                >
                    <span className="loading-spinner" aria-hidden="true" />
                </div>
            ) : filteredPosts.length > 0 && debouncedQuery ? (
                <div className="feed-end">
                    これ以上ありません ({filteredPosts.length}件)
                </div>
            ) : null}

            {/* Back to top */}
            <button
                className={`back-to-top ${showBackToTop ? "visible" : ""}`}
                onClick={scrollToTop}
                aria-label="トップに戻る"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                </svg>
            </button>
        </div>
    );
}
