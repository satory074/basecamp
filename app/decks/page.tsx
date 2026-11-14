import { readFile } from "node:fs/promises";
import path from "node:path";
import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader, FeedStatus } from "../components/site/SiteChrome";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import DeckList from "../components/DeckList";
import type { DeckData } from "../lib/types";

export const metadata: Metadata = pageMetadata("decks", "使用中のツール・サービス一覧");

/** public/data/decks.json (git 管理) をビルド時に読む。以前はブラウザが読み込み中を出してから取りに行っていた */
async function loadDecks(): Promise<DeckData | null> {
    try {
        const raw = await readFile(path.join(process.cwd(), "public/data/decks.json"), "utf8");
        return JSON.parse(raw) as DeckData;
    } catch {
        return null;
    }
}

export default async function DecksPage() {
    const deckData = await loadDecks();
    const totalTools = deckData?.categories.reduce((sum, cat) => sum + cat.items.length, 0) ?? 0;

    return (
        <div className="page">
            <PageHeader platform="decks" description="使用中のツール・サービス" />
            {deckData ? (
                <>
            <PlatformDashboard
                stats={[
                    { label: "ツール", value: totalTools },
                    { label: "カテゴリ", value: deckData.categories.length },
                ]}
            />
            <DeckList categories={deckData.categories} />
                </>
            ) : (
                <FeedStatus kind="empty" />
            )}
        </div>
    );
}
