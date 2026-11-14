import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import SpotifyClient from "./SpotifyClient";

export const metadata: Metadata = pageMetadata("spotify", "最近再生した曲とプレイリスト");

export default function SpotifyPage() {
    return (
        <div className="page">
                    <PageHeader platform="spotify" description="最近再生した曲とプレイリスト" />

                    {/* Posts */}
                    <SpotifyClient />
                </div>
    );
}
