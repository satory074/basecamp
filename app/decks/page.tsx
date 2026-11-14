import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import DecksClient from "./DecksClient";

export const metadata: Metadata = pageMetadata("decks", "使用中のツール・サービス一覧");

export default function DecksPage() {
    return (
        <div className="page">
                    <PageHeader platform="decks" description="使用中のツール・サービス" />

                    <DecksClient />
                </div>
    );
}
