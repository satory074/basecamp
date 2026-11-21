// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./styles/site.css";
import PlatformTokens from "./components/site/PlatformTokens";
import SiteHeader from "./components/site/SiteHeader";
import { SiteFooter } from "./components/site/SiteChrome";
import { config } from "./lib/config";
import { buildMetadata } from "./lib/seo";

/**
 * 全ページの既定値 (= ホーム)。下層ページは pageMetadata() / buildMetadata() で全項目を上書きする。
 * robots に index/follow を書かない (既定で index)。書くと 404 ページに noindex と index が両方出ていた。
 */
export const metadata: Metadata = {
    metadataBase: new URL(config.siteUrl),
    ...buildMetadata({ title: config.siteTitle, description: config.siteDescription, path: "/" }),
    authors: [{ name: config.siteName, url: `${config.siteUrl}/` }],
    creator: config.siteName,
    publisher: config.siteName,
    robots: {
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
    },
    verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    // サイト自身が暗色に対応しているので、拡張機能 Dark Reader による色の書き換えを止める
    other: { "darkreader-lock": "true" },
};

// ブラウザ標準の部品 (スクロールバー・フォーム) と読み込み直後の背景を OS の明暗に合わせる
export const viewport: Viewport = {
    colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    // Cloudflare Web Analytics — Cookie 不要のプライバシー配慮解析。
    // NEXT_PUBLIC_CF_BEACON_TOKEN が入っていればビーコンを出力し、未設定なら何も出さない
    // （ビルドは壊れない＝graceful）。トークンはページソースに出る公開値なので secret ではなく
    // GitHub Actions の repository variable で渡す (deploy-pages.yml)。satory074.com は satory074.github.io とは別ホストなので
    // Cloudflare 側でも別サイト登録＝別トークンにすること。
    const cfBeaconToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

    return (
        <html lang="ja">
            <head>
                <PlatformTokens />
                {cfBeaconToken && (
                    <script
                        defer
                        src="https://static.cloudflareinsights.com/beacon.min.js"
                        data-cf-beacon={JSON.stringify({ token: cfBeaconToken })}
                    />
                )}
            </head>
            <body>
                {/* スキップリンク → ヘッダー → 本文 → フッター。本文の先頭がナビではなくなったので、スキップが実際に効く */}
                <a href="#main-content" className="skip-to-content">
                    本文へ移動
                </a>
                <SiteHeader />
                <main id="main-content" tabIndex={-1}>{children}</main>
                <SiteFooter />
            </body>
        </html>
    );
}
