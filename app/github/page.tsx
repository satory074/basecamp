import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import GithubClient from "./GithubClient";

export const metadata: Metadata = pageMetadata("github", "オープンソースプロジェクト・リポジトリ一覧");

export default function GitHubPage() {
    return (
        <div className="page">
                    <PageHeader platform="github" description="オープンソースプロジェクト" />

                    {/* Posts */}
                    <GithubClient />
                </div>
    );
}
