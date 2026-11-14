import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import SoundCloudClient from "./SoundCloudClient";

export const metadata: Metadata = pageMetadata("soundcloud", "音楽とトラック");

export default function SoundCloudPage() {
    return (
        <div className="page">
            <PageHeader platform="soundcloud" description="音楽とトラック" />

            {/* SoundCloud Player */}
            <SoundCloudClient />
        </div>
    );
}
