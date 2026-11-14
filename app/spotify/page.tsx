import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformFeed from "../components/feed/PlatformFeed";
import { getSpotifyPosts } from "../lib/feeds/spotify";
import { renderSpotifyDashboard } from "./dashboard";

export const metadata: Metadata = pageMetadata("spotify", "最近再生した曲とプレイリスト");

export default async function SpotifyPage() {
    const posts = await getSpotifyPosts();

    return (
        <div className="page">
            <PageHeader platform="spotify" description="最近再生した曲とプレイリスト" />

            {renderSpotifyDashboard(posts)}
            <PlatformFeed platform="spotify" initialPosts={posts.slice(0, 20)} totalCount={posts.length} src="/api/spotify" />
        </div>
    );
}
