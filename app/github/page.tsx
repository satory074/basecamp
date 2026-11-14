import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import PlatformFeed from "../components/feed/PlatformFeed";
import { getGithubPosts } from "../lib/feeds/github";
import { renderGithubDashboard } from "./dashboard";

export const metadata: Metadata = pageMetadata("github", "オープンソースプロジェクト・リポジトリ一覧");

export default async function GitHubPage() {
    const posts = await getGithubPosts();

    return (
        <div className="page">
            <PageHeader platform="github" description="オープンソースプロジェクト" />

            {renderGithubDashboard(posts)}
            <PlatformFeed platform="github" initialPosts={posts.slice(0, 20)} totalCount={posts.length} src="/api/github" />
        </div>
    );
}
