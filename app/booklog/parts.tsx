/** ブクログ ページの部品 (★5 の本の棚)。ビルド時にサーバーで描く */
import Image from "next/image";
import type { Post } from "../lib/types";

function HighRatedCard({ post }: { post: Post }) {
    return (
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="high-rated-card">
            {post.thumbnail ? (
                <Image
                    src={post.thumbnail}
                    alt=""
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

export function HighRatedSection({ posts }: { posts: Post[] }) {
    if (posts.length === 0) return null;
    return (
        <section className="high-rated-section">
            <h2 className="section-heading">★5 の本</h2>
            <div className="high-rated-grid">
                {posts.map((post) => (
                    <HighRatedCard key={post.id} post={post} />
                ))}
            </div>
        </section>
    );
}

