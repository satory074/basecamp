import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import HatenabookmarkClient from "./HatenabookmarkClient";

export const metadata: Metadata = pageMetadata("hatenabookmark", "ブックマーク履歴");

export default function HatenabookmarkPage() {
    return (
        <div className="page">
                    <PageHeader platform="hatenabookmark" description="ブックマーク履歴" />

                    {/* Posts */}
                    <HatenabookmarkClient />
                </div>
    );
}
