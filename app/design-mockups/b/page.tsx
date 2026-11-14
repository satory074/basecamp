import { getHomeData } from "@/app/lib/home-feed";
import { groupByJstDay } from "@/app/lib/feed/days";
import HomeIntro from "../_parts/HomeIntro";
import WorksCarousel from "../_parts/WorksCarousel";
import FeedDays from "../_parts/FeedDays";

/** B 案のホーム。本物のフィードの直近 3 日分を使う */
export default async function VariantBHome() {
    const { posts, stats, bio, apps } = await getHomeData();
    const recent = groupByJstDay(posts).slice(0, 3).flatMap((d) => d.posts);
    return (
        <div className="page">
            <HomeIntro stats={stats} bio={bio} />
            <WorksCarousel apps={apps} />
            <FeedDays posts={recent} variant="b" />
        </div>
    );
}
