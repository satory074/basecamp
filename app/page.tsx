import HomeIntro from "./components/home/HomeIntro";
import WorksCarousel from "./components/home/WorksCarousel";
import HomeFeed from "./components/home/HomeFeed";
import { getHomeData, getHomeFeedPosts } from "./lib/home-feed";
import { INITIAL_DAYS, groupByJstDay } from "./lib/feed/days";

const HOME_FEED_SOURCES = ["/api/home-feed/recent", "/api/home-feed/archive"];

export default async function Home() {
    const [{ stats, bio, apps }, posts] = await Promise.all([getHomeData(), getHomeFeedPosts()]);
    // HTML に埋め込むのは直近の数日分だけ。それより前は /api/home-feed/* を必要なときに読む
    const days = groupByJstDay(posts);
    const initialPosts = days.slice(0, INITIAL_DAYS).flatMap((d) => d.posts);

    return (
        <div className="page">
            <HomeIntro stats={stats} bio={bio} />
            <WorksCarousel apps={apps} />
            <HomeFeed
                initialPosts={initialPosts}
                totalCount={posts.length}
                totalDays={days.length}
                sources={HOME_FEED_SOURCES}
            />
        </div>
    );
}
