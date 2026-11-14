import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformFeed from "../components/feed/PlatformFeed";
import { getSwarmPosts } from "../lib/feeds/swarm";
import { renderSwarmDashboard } from "./dashboard";

export const metadata: Metadata = pageMetadata("swarm", "訪れた場所のチェックイン記録");

export default async function SwarmPage() {
    const posts = await getSwarmPosts();

    return (
        <div className="page">
            <PageHeader platform="swarm" description="訪れた場所のチェックイン記録" />

            {renderSwarmDashboard(posts)}
            <PlatformFeed platform="swarm" initialPosts={posts.slice(0, 20)} totalCount={posts.length} src="/api/swarm" />
        </div>
    );
}
