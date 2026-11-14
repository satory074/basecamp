import type { ReactNode } from "react";
import { PLATFORMS, type PlatformKey } from "@/app/lib/platforms";
import { navEntry } from "@/app/lib/navigation";
import { config } from "@/app/lib/config";
import ProfileLinkList from "./ProfileLinkList";

type Profiles = Partial<Record<string, { url?: string; lodestoneUrl?: string }>>;

/**
 * 各ページの見出し。h1 はページに 1 つ (以前はサイドバーの名前も h1 で 2 つあった)。
 * 名前と説明は navigation.ts / platforms.ts の台帳から出す (ナビ・タイトルと表記をそろえる)。
 */
export function PageHeader({ platform, title, description, profile = true, children }: {
    platform: PlatformKey;
    /** 台帳の名前と違う見出しにするとき (例: 「プロ野球 8月の試合結果」) */
    title?: string;
    description?: string;
    /** 外部プロフィールへのリンクを出すか (天鳳のように個人ページが無いサービスは false) */
    profile?: boolean;
    /** 見出しの下に並べる追加のリンク */
    children?: ReactNode;
}) {
    const entry = (config.profiles as Profiles)[platform];
    const url = profile ? entry?.url ?? entry?.lodestoneUrl : undefined;
    const label = PLATFORMS[platform].label;
    return (
        <header className="page-header">
            <h1 className="page-title">{title ?? label}</h1>
            <p className="page-desc">{description ?? navEntry(platform)?.description}</p>
            {(url || children) && (
                <p className="page-links">
                    {url && (
                        <a className="page-profile" href={url} target="_blank" rel="noopener noreferrer">
                            {label}のプロフィール
                            <span className="visually-hidden">（新しいタブで開く）</span>
                        </a>
                    )}
                    {children}
                </p>
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
export function FeedStatus({ kind, onRetry }: { kind: "empty" | "loading" | "error"; onRetry?: () => void }) {
    if (kind === "loading") {
        return <p className="status-box" role="status">読み込んでいます…</p>;
    }
    if (kind === "error") {
        return (
            <div className="status-box" role="alert">
                <p>記録を読み込めませんでした。通信状態を確かめて、もう一度お試しください。</p>
                {onRetry && <button type="button" className="text-button" onClick={onRetry}>もう一度読み込む</button>}
            </div>
        );
    }
    return <p className="status-box">まだ記録がありません。</p>;
}
