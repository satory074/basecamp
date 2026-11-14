import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformFeed from "../components/feed/PlatformFeed";
import { getHatenaPosts } from "../lib/feeds/hatena";
import { renderHatenaDashboard } from "./dashboard";

export const metadata: Metadata = pageMetadata("hatena", "技術記事とエッセイ");

export default async function HatenaPage() {
    const posts = await getHatenaPosts();

    return (
        <div className="page">
            <PageHeader platform="hatena" description="技術記事とエッセイ" />

            {renderHatenaDashboard(posts)}
            <PlatformFeed platform="hatena" initialPosts={posts.slice(0, 20)} totalCount={posts.length} src="/api/hatena" />
        </div>
    );
}
