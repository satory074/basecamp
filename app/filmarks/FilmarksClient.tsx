"use client";

import Image from "next/image";
import FeedPosts from "../components/FeedPosts";
import type { Post } from "../lib/types";

// クライアント側でのデータ取得関数
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

interface FilmarksClientProps {
    highRatedMovies: Post[];
    highRatedDramas: Post[];
    highRatedAnimes: Post[];
}

export default function FilmarksClient({
    highRatedMovies,
    highRatedDramas,
    highRatedAnimes,
}: FilmarksClientProps) {
    return (
        <>
            {/* 高評価作品セクション（カテゴリ別） */}
            <HighRatedSection posts={highRatedMovies} title="高評価映画" />
            <HighRatedSection posts={highRatedDramas} title="高評価ドラマ" />
            <HighRatedSection posts={highRatedAnimes} title="高評価アニメ" />

            {/* 全投稿 */}
            <FeedPosts fetchPosts={fetchFilmarksPosts} source="Filmarks" />
        </>
    );
}
