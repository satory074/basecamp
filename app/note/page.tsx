import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformFeed from "../components/feed/PlatformFeed";
import { getNotePosts } from "../lib/feeds/note";
import { renderNoteDashboard } from "./dashboard";

export const metadata: Metadata = pageMetadata("note", "クリエイターとしての発信");

export default async function NotePage() {
    const posts = await getNotePosts();

    return (
        <div className="page">
            <PageHeader platform="note" description="クリエイターとしての発信" />

            {renderNoteDashboard(posts)}
            <PlatformFeed platform="note" initialPosts={posts.slice(0, 20)} totalCount={posts.length} src="/api/note" />
        </div>
    );
}
