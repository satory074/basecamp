import { PLATFORMS, type PlatformKey } from "@/app/lib/platforms";
import { navEntry } from "@/app/lib/navigation";
import { config } from "@/app/lib/config";
import ProfileLinkList from "./ProfileLinkList";

/** ページ見出し。h1 はページに 1 つ (以前はサイドバーの名前も h1 で 2 つあった) */
export function PageHeader({ platform, description }: { platform: PlatformKey; description?: string }) {
    const profiles = config.profiles as Partial<Record<string, { url?: string; lodestoneUrl?: string }>>;
    const profile = profiles[platform];
    const url = profile?.url ?? profile?.lodestoneUrl;
    return (
        <header className="page-header">
            <h1 className="page-title">{PLATFORMS[platform].label}</h1>
            <p className="page-desc">{description ?? navEntry(platform)?.description}</p>
            {url && (
                <a className="page-profile" href={url} target="_blank" rel="noopener noreferrer">
                    {PLATFORMS[platform].label}のプロフィール
                    <span className="visually-hidden">（新しいタブで開く）</span>
                </a>
            )}
        </header>
    );
}

export function SiteFooter() {
    return (
        <footer id="site-footer" className="site-footer" tabIndex={-1}>
            <ProfileLinkList label="外部のプロフィール（フッター）" />
            <p className="site-footer-copy">© {new Date().getFullYear()} satory074</p>
        </footer>
    );
}

/** 空・読み込み中・エラーの表示。文言は訪問者向けにする (開発者向けの手順は出さない) */
export function FeedStatus({ kind }: { kind: "empty" | "loading" | "error" }) {
    if (kind === "loading") {
        return <p className="status-box" role="status">続きを読み込んでいます…</p>;
    }
    if (kind === "error") {
        return (
            <div className="status-box" role="alert">
                <p>記録を読み込めませんでした。通信状態を確かめて、もう一度お試しください。</p>
                <button type="button" className="text-button">もう一度読み込む</button>
            </div>
        );
    }
    return <p className="status-box">まだ記録がありません。</p>;
}
