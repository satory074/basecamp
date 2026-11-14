import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformFeed from "../components/feed/PlatformFeed";
import { getSteamPosts } from "../lib/feeds/steam";
import { renderSteamDashboard } from "./dashboard";

export const metadata: Metadata = pageMetadata("steam", "Steamゲーム実績");

export default async function SteamPage() {
    const posts = await getSteamPosts();

    return (
        <div className="page">
            <PageHeader platform="steam" description="ゲーム実績" />

            {renderSteamDashboard(posts)}
            <PlatformFeed platform="steam" initialPosts={posts.slice(0, 20)} totalCount={posts.length} src="/api/steam" />
        </div>
    );
}
