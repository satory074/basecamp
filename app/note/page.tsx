import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import NoteClient from "./NoteClient";

export const metadata: Metadata = pageMetadata("note", "クリエイターとしての発信");

export default function NotePage() {
    return (
        <div className="page">
                    <PageHeader platform="note" description="クリエイターとしての発信" />

                    {/* Posts */}
                    <NoteClient />
                </div>
    );
}
