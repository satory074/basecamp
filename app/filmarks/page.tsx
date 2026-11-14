import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import FilmarksClient from "./FilmarksClient";
import { getFilmarksPosts } from "../lib/feeds/filmarks";

export const metadata: Metadata = pageMetadata("filmarks", "映画・ドラマ・アニメ視聴記録");

const HIGH_RATING_THRESHOLD = 4.5;

export default async function FilmarksPage() {
    const posts = await getFilmarksPosts();

    // 高評価作品のフィルタリング・ソート
    const filtered = posts.filter(
        (post) => post.rating !== undefined && post.rating >= HIGH_RATING_THRESHOLD
    );
    filtered.sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // カテゴリ別に分類
    const highRatedMovies = filtered.filter((p) => p.description === "映画");
    const highRatedDramas = filtered.filter((p) => p.description === "ドラマ");
    const highRatedAnimes = filtered.filter((p) => p.description === "アニメ");

    return (
        <div className="page">
                    <PageHeader platform="filmarks" description="映画・ドラマ・アニメ視聴記録" />

                    {/* Client Component for high-rated sections and feed */}
                    <FilmarksClient
                        highRatedMovies={highRatedMovies}
                        highRatedDramas={highRatedDramas}
                        highRatedAnimes={highRatedAnimes}
                    />
                </div>
    );
}
