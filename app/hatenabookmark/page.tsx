import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformFeed from "../components/feed/PlatformFeed";
import { getHatenaBookmarkPosts } from "../lib/feeds/hatenabookmark";
import { renderHatenabookmarkDashboard } from "./dashboard";

export const metadata: Metadata = pageMetadata("hatenabookmark", "ブックマーク履歴");

export default async function HatenabookmarkPage() {
    const posts = await getHatenaBookmarkPosts();

    return (
        <div className="page">
            <PageHeader platform="hatenabookmark" description="ブックマーク履歴" />

            {renderHatenabookmarkDashboard(posts)}
            <PlatformFeed platform="hatenabookmark" initialPosts={posts.slice(0, 20)} totalCount={posts.length} src="/api/hatenabookmark" />
        </div>
    );
}
