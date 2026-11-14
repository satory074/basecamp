import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import HatenaClient from "./HatenaClient";

export const metadata: Metadata = pageMetadata("hatena", "技術記事とエッセイ");

export default function HatenaPage() {
    return (
        <div className="page">
                    <PageHeader platform="hatena" description="技術記事とエッセイ" />

                    {/* Posts */}
                    <HatenaClient />
                </div>
    );
}
