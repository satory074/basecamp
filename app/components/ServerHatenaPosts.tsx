import { getHatenaPosts } from "../lib/posts";
import type { Post } from "../lib/types";

export default async function ServerHatenaPosts() {
    const posts: Post[] = await getHatenaPosts();

    return (
        <div className="my-8">
            <div className="space-y-4">
                {posts.slice(0, 5).map((post) => (
                    <article key={post.id} className="border-b pb-4">
                        <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:bg-gray-50 dark:hover:bg-gray-800 p-4 rounded-lg transition"
                        >
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <span>📝</span>
                                <time dateTime={post.date}>{new Date(post.date).toLocaleDateString("ja-JP")}</time>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                            {post.data?.description && (
                                <p className="text-gray-600 dark:text-gray-400">{post.data.description}</p>
                            )}
                        </a>
                    </article>
                ))}
            </div>
        </div>
    );
}
