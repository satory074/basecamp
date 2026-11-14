import { getGithubPosts } from "@/app/lib/feeds/github";
import { PageHeader, FeedStatus } from "./Chrome";
import PostCard from "./PostCard";

/**
 * プラットフォームページの見本 (GitHub)。見出し・統計・グラフ・カード・空表示を 1 ページに並べる。
 * 統計とグラフはビルド時に計算する (本番でもクライアントの fetch を待たない形にする)。
 */
export default async function GithubDemo() {
    const posts = await getGithubPosts().catch(() => []);
    const languages = new Map<string, number>();
    for (const p of posts) {
        if (p.language) languages.set(p.language, (languages.get(p.language) ?? 0) + 1);
    }
    const langEntries = [...languages.entries()].sort((a, b) => b[1] - a[1]);
    const stars = posts.reduce((n, p) => n + (p.stars ?? 0), 0);
    const max = Math.max(1, ...langEntries.map(([, n]) => n));

    return (
        <div className="page">
            <PageHeader platform="github" />

            <dl className="stats">
                <div className="stat"><dt>公開リポジトリ</dt><dd>{posts.length}</dd></div>
                <div className="stat"><dt>言語</dt><dd>{langEntries.length}</dd></div>
                <div className="stat"><dt>スター</dt><dd>{stars}</dd></div>
            </dl>

            {langEntries.length > 0 && (
                <figure className="chart">
                    <figcaption className="section-heading">使っている言語</figcaption>
                    <ul className="bar-list" role="list">
                        {langEntries.map(([lang, n]) => (
                            <li key={lang}>
                                <span className="bar-label">{lang}</span>
                                <span className="bar-track" aria-hidden="true">
                                    <span className="bar-fill" style={{ inlineSize: `${(n / max) * 100}%` }} />
                                </span>
                                <span className="bar-value">{n}</span>
                            </li>
                        ))}
                    </ul>
                </figure>
            )}

            <section aria-labelledby="gh-list">
                <h2 id="gh-list" className="section-heading">更新したリポジトリ</h2>
                <ul className="day-list" role="list">
                    {posts.slice(0, 5).map((p) => (
                        <li key={p.id}>
                            <PostCard post={{ ...p, platform: "github" }} timeFormat="datetime" />
                        </li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="gh-states">
                <h2 id="gh-states" className="section-heading">空・読み込み中・エラーの表示（見本）</h2>
                <FeedStatus kind="empty" />
                <FeedStatus kind="loading" />
                <FeedStatus kind="error" />
            </section>
        </div>
    );
}
