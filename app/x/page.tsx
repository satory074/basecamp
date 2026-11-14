import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import XClient from "./XClient";

export const metadata: Metadata = pageMetadata("x", "ポストといいね");

export default function XPage() {
    return (
        <div className="page">
                    <PageHeader platform="x" description="ポストといいね" />

                    <XClient />
                </div>
    );
}
