import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import DuolingoClient from "./DuolingoClient";

export const metadata: Metadata = pageMetadata("duolingo", "語学学習の進捗");

export default function DuolingoPage() {
    return (
        <div className="page">
                    <PageHeader platform="duolingo" description="語学学習の進捗" />

                    <DuolingoClient />
                </div>
    );
}
