import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import FF14Character, { type FF14CharacterData } from "../components/FF14Character";
import { getFF14Character } from "../lib/feeds/ff14";

export const metadata: Metadata = pageMetadata("ff14", "ファイナルファンタジーXIV キャラクター情報");

export default async function FF14Page() {
    const data = (await getFF14Character().catch(() => null)) as FF14CharacterData | null;

    return (
        <div className="page">
            <PageHeader platform="ff14" description="ファイナルファンタジーXIV のキャラクター">
                <a href="/ff14-achievements/">アチーブメント</a>
                <a href="https://jp.finalfantasyxiv.com/" target="_blank" rel="noopener noreferrer">
                    FF14 公式サイト
                    <span className="visually-hidden">（新しいタブで開く）</span>
                </a>
            </PageHeader>

            {/* Character Info */}
            <FF14Character character={data} />
        </div>
    );
}
