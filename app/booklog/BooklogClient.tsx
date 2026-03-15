"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import type { Post } from "../lib/types";

const BooklogPosts = dynamic(() => import("@/app/components/BooklogPosts"), {
    ssr: false,
    loading: () => <div className="py-12 text-center text-gray-500">読み込み中...</div>
});

function HighRatedCard({ post }: { post: Post }) {
    return (
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="high-rated-card">
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
                <div className="high-rated-thumbnail high-rated-placeholder high-rated-placeholder--booklog" />
            )}
            <div className="high-rated-info">
                <span className="high-rated-title">{post.title}</span>
                <span className="high-rated-rating high-rated-rating--booklog">★★★★★</span>
            </div>
        </a>
    );
}

function HighRatedSection({ posts }: { posts: Post[] }) {
    if (posts.length === 0) return null;
    return (
        <section className="high-rated-section">
            <h2 className="text-lg font-semibold mb-4">★5の本</h2>
            <div className="high-rated-grid">
                {posts.map((post) => (
                    <HighRatedCard key={post.id} post={post} />
                ))}
            </div>
        </section>
    );
}

interface BooklogClientProps {
    highRatedBooks: Post[];
}

export default function BooklogClient({ highRatedBooks }: BooklogClientProps) {
    return (
        <>
            <HighRatedSection posts={highRatedBooks} />
            <BooklogPosts />
        </>
    );
}
