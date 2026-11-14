import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import SteamClient from "./SteamClient";

export const metadata: Metadata = pageMetadata("steam", "Steamゲーム実績");

export default function SteamPage() {
    return (
        <div className="page">
                    <PageHeader platform="steam" description="ゲーム実績" />

                    <SteamClient />
                </div>
    );
}
