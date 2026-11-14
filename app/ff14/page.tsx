import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import FF14Client from "./FF14Client";

export const metadata: Metadata = pageMetadata("ff14", "ファイナルファンタジーXIV キャラクター情報");

export default function FF14Page() {
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
                    <FF14Client />
                </div>
    );
}
