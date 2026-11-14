import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import SwarmClient from "./SwarmClient";

export const metadata: Metadata = pageMetadata("swarm", "訪れた場所のチェックイン記録");

export default function SwarmPage() {
    return (
        <div className="page">
                    <PageHeader platform="swarm" description="訪れた場所のチェックイン記録" />

                    <SwarmClient />
                </div>
    );
}
