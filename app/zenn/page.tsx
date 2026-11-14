import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformFeed from "../components/feed/PlatformFeed";
import { getZennPosts } from "../lib/feeds/zenn";
import { renderZennDashboard } from "./dashboard";

export const metadata: Metadata = pageMetadata("zenn", "技術記事とチュートリアル");

export default async function ZennPage() {
    const posts = await getZennPosts();

    return (
        <div className="page">
            <PageHeader platform="zenn" description="技術記事とチュートリアル" />

            {renderZennDashboard(posts)}
            <PlatformFeed platform="zenn" initialPosts={posts.slice(0, 20)} totalCount={posts.length} src="/api/zenn" />
        </div>
    );
}
