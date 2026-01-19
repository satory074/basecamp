"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Sidebar from "../components/Sidebar";
import FeedPosts from "../components/FeedPosts";
import type { Post } from "../lib/types";

const HIGH_RATING_THRESHOLD = 4.5;

async function fetchFilmarksPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/filmarks");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

// 高評価作品カードコンポーネント
function HighRatedCard({ post }: { post: Post }) {
    return (
        <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="high-rated-card"
        >
            {post.thumbnail ? (
                <Image
                    src={post.thumbnail}
                    alt={post.title}
                    width={120}
                    height={180}
                    className="high-rated-thumbnail"
                    style={{ objectFit: "cover" }}
                />
            ) : (
                <div className="high-rated-thumbnail high-rated-placeholder" />
            )}
            <div className="high-rated-info">
                <span className="high-rated-title">{post.title}</span>
                <span className="high-rated-rating">★ {post.rating}</span>
            </div>
        </a>
    );
}

// 高評価作品セクションコンポーネント
function HighRatedSection({ posts, title }: { posts: Post[]; title: string }) {
    if (posts.length === 0) return null;

    return (
        <section className="high-rated-section">
            <h2 className="text-lg font-semibold mb-4">{title}</h2>
            <div className="high-rated-grid">
                {posts.map((post) => (
                    <HighRatedCard key={post.id} post={post} />
                ))}
            </div>
        </section>
    );
}

export default function FilmarksPage() {
    const [highRatedMovies, setHighRatedMovies] = useState<Post[]>([]);
    const [highRatedDramas, setHighRatedDramas] = useState<Post[]>([]);
    const [highRatedAnimes, setHighRatedAnimes] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadHighRatedPosts() {
            const posts = await fetchFilmarksPosts();
            const filtered = posts.filter(
                (post) => post.rating !== undefined && post.rating >= HIGH_RATING_THRESHOLD
            );
            // 評価（降順）→ 日付（降順）でソート
            filtered.sort((a, b) => {
                const ratingDiff = (b.rating || 0) - (a.rating || 0);
                if (ratingDiff !== 0) return ratingDiff;
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
            // カテゴリ別に分類
            setHighRatedMovies(filtered.filter((p) => p.description === "映画"));
            setHighRatedDramas(filtered.filter((p) => p.description === "ドラマ"));
            setHighRatedAnimes(filtered.filter((p) => p.description === "アニメ"));
            setIsLoading(false);
        }
        loadHighRatedPosts();
    }, []);

    return (
        <div className="split-layout">
            <Sidebar activePlatform="filmarks" />

            <main className="main-content">
                <div className="content-wrapper">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Filmarks</h1>
                        <p className="text-gray-500 text-sm mt-1">映画・ドラマ・アニメ視聴記録</p>
                    </div>

                    {/* 高評価作品セクション（カテゴリ別） */}
                    {!isLoading && (
                        <>
                            <HighRatedSection posts={highRatedMovies} title="高評価映画" />
                            <HighRatedSection posts={highRatedDramas} title="高評価ドラマ" />
                            <HighRatedSection posts={highRatedAnimes} title="高評価アニメ" />
                        </>
                    )}

                    {/* 全投稿 */}
                    <FeedPosts
                        fetchPosts={fetchFilmarksPosts}
                        source="Filmarks"
                    />

                    {/* Footer for mobile */}
                    <div className="footer hide-desktop">
                        <p>© 2025 Basecamp</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
