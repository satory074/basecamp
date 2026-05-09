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

/** 日付ラベルを生成（「今日」「昨日」「3月23日」等） */
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

/** フィルター用プラットフォーム情報 */
const filterPlatforms = [
    { key: "x", label: "X", colorVar: "--color-x" },
    { key: "github", label: "GitHub", colorVar: "--color-github" },
    { key: "hatena", label: "Hatena", colorVar: "--color-hatena" },
    { key: "zenn", label: "Zenn", colorVar: "--color-zenn" },
    { key: "hatenabookmark", label: "はてブ", colorVar: "--color-hatenabookmark" },
    { key: "duolingo", label: "Duolingo", colorVar: "--color-duolingo" },
    { key: "spotify", label: "Spotify", colorVar: "--color-spotify" },
    { key: "booklog", label: "Booklog", colorVar: "--color-booklog" },
    { key: "filmarks", label: "Filmarks", colorVar: "--color-filmarks" },
    { key: "steam", label: "Steam", colorVar: "--color-steam" },
    { key: "tenhou", label: "天鳳", colorVar: "--color-tenhou" },
    { key: "ff14-achievement", label: "FF14", colorVar: "--color-ff14-achievement" },
    { key: "naita", label: "泣いた", colorVar: "--color-naita" },
    { key: "note", label: "Note", colorVar: "--color-note" },
    { key: "diary", label: "日記", colorVar: "--color-diary" },
    { key: "swarm", label: "Swarm", colorVar: "--color-swarm" },
];


export default function HomeFeed({ initialPosts, platformActivity }: HomeFeedProps) {
    const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
    const [query, setQuery] = useState("");
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [chartOpen, setChartOpen] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Hydrate state from URL (?q=...&p=x,github) on mount — client only, avoids
    // Suspense requirement of useSearchParams and SSR/CSR mismatch.
    useEffect(() => {
        const sp = new URLSearchParams(window.location.search);
        const q = sp.get("q") ?? "";
        const p = (sp.get("p") ?? "").split(",").filter(Boolean);
        if (q) setQuery(q);
        if (p.length) setActiveFilters(p);
    }, []);

    // Persist search/filter state to URL (debounced); use raw History API so Next
    // does not refetch the RSC payload on every change.
    useEffect(() => {
        const t = setTimeout(() => {
            const sp = new URLSearchParams();
            if (query) sp.set("q", query);
            if (activeFilters.length) sp.set("p", activeFilters.join(","));
            const qs = sp.toString();
            const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
            window.history.replaceState({}, "", url);
        }, 300);
        return () => clearTimeout(t);
    }, [query, activeFilters]);

    const searchedPosts = useMemo(() => {
        if (!query) return initialPosts;
        const needle = query.toLowerCase();
        return initialPosts.filter(p =>
            (p.title ?? "").toLowerCase().includes(needle)
            || (p.description ?? "").toLowerCase().includes(needle)
        );
    }, [initialPosts, query]);

    const filteredPosts = useMemo(
        () => activeFilters.length === 0
            ? searchedPosts
            : searchedPosts.filter(p => activeFilters.includes(p.platform)),
        [searchedPosts, activeFilters]
    );

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

    // Platform counts for filter chips — contextual to current search so the chip
    // numbers reflect "how many results in this platform given the current query".
    const platformCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const p of searchedPosts) {
            counts[p.platform] = (counts[p.platform] ?? 0) + 1;
        }
        return counts;
    }, [searchedPosts]);

    // Reset pagination whenever the filtered set changes (filter or search edit).
    useEffect(() => {
        setVisibleCount(POSTS_PER_PAGE);
    }, [query, activeFilters]);

    // Infinite scroll
    useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => Math.min(prev + POSTS_PER_PAGE, filteredPosts.length));
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

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleFilterClick = useCallback((key: string) => {
        setActiveFilters(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    }, []);

    const handleAllClick = useCallback(() => {
        setActiveFilters([]);
    }, []);

    const handleResetAll = useCallback(() => {
        setQuery("");
        setActiveFilters([]);
    }, []);

    // Build posts with date separators
    const postsWithSeparators = useMemo(() => {
        const result: { type: "post" | "separator"; post?: ContentItem; label?: string }[] = [];
        let lastDateLabel = "";

        for (const post of visiblePosts) {
            const dateLabel = getDateLabel(post.date);
            if (dateLabel && dateLabel !== lastDateLabel) {
                result.push({ type: "separator", label: dateLabel });
                lastDateLabel = dateLabel;
            }
            result.push({ type: "post", post });
        }
        return result;
    }, [visiblePosts]);

    const totalCount = initialPosts.length;
    const isFiltered = query.length > 0 || activeFilters.length > 0;

    return (
        <div>
            {/* Sticky search + filter controls */}
            <div className="feed-controls">
                <SearchBar value={query} onSearch={setQuery} placeholder="投稿を検索..." />
                <div className="filter-chips">
                    <button
                        className={`filter-chip ${activeFilters.length === 0 ? "active" : ""}`}
                        onClick={handleAllClick}
                    >
                        All
                        <span className="filter-chip-count">{searchedPosts.length}</span>
                    </button>
                    {filterPlatforms
                        .filter(fp => (platformCounts[fp.key] ?? 0) > 0)
                        .map(fp => (
                            <button
                                key={fp.key}
                                className={`filter-chip ${activeFilters.includes(fp.key) ? "active" : ""}`}
                                onClick={() => handleFilterClick(fp.key)}
                            >
                                <span
                                    className="filter-chip-dot"
                                    style={{ backgroundColor: `var(${fp.colorVar})` }}
                                />
                                {fp.label}
                                <span className="filter-chip-count">{platformCounts[fp.key]}</span>
                            </button>
                        ))}
                </div>
                <div className="filter-summary">
                    {isFiltered
                        ? `${filteredPosts.length}件 / ${totalCount}件中`
                        : `${totalCount}件`}
                </div>
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

            {/* Empty state */}
            {filteredPosts.length === 0 && (
                <div className="feed-empty">
                    <p>該当する投稿がありません</p>
                    {isFiltered && (
                        <button className="filter-chip" onClick={handleResetAll}>
                            フィルタをクリア
                        </button>
                    )}
                </div>
            )}

            {/* Feed with date separators */}
            {postsWithSeparators.map((item, idx) => {
                if (item.type === "separator") {
                    return (
                        <div key={`sep-${item.label}`} className="date-separator">
                            <span className="date-separator-label">{item.label}</span>
                            <div className="date-separator-line" />
                        </div>
                    );
                }

                const post = item.post!;

                if (post.platform === "x") {
                    const xPost = post as ContentItem & XTweet;
                    return (
                        <article
                            key={post.id || idx}
                            className="feed-item platform-x feed-item-featured"
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
                    />
                );
            })}

            {hasMore ? (
                <div
                    ref={loadMoreRef}
                    className="load-more-sentinel"
                    role="status"
                    aria-live="polite"
                    aria-label="読み込み中..."
                >
                    <span className="loading-spinner" aria-hidden="true" />
                </div>
            ) : filteredPosts.length > 0 ? (
                <div className="feed-end">
                    これ以上ありません ({filteredPosts.length}件すべて表示済み)
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
