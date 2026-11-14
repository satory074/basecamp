import HomeSidebar from "./components/HomeSidebar";
import HomeFeed from "./components/HomeFeed";
import AppsCarousel from "./components/AppsCarousel";
import { getHomeData } from "./lib/home-feed";

export default async function Home() {
    const { posts, stats, platformActivity, bio, apps } = await getHomeData();

    return (
        <div className="split-layout">
            <HomeSidebar stats={stats} bio={bio} />

            <div className="main-content">
                <div className="content-wrapper">
                    <AppsCarousel apps={apps} />

                    <h2 id="recent-posts-heading" className="section-title">Recent Posts</h2>

                    <HomeFeed initialPosts={posts} platformActivity={platformActivity} />

                    <div id="site-footer" tabIndex={-1} className="footer">
                        <p>© {new Date().getFullYear()} satory074</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
