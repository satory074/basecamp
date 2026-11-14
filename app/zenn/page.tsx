import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import ZennClient from "./ZennClient";

export const metadata: Metadata = pageMetadata("zenn", "技術記事とチュートリアル");

export default function ZennPage() {
    return (
        <div className="page">
                    <PageHeader platform="zenn" description="技術記事とチュートリアル" />

                    {/* Posts */}
                    <ZennClient />
                </div>
    );
}
