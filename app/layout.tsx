// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { config } from "./lib/config";
import { generateWebSiteSchema, generatePersonSchema } from "./lib/jsonld";

export const metadata: Metadata = {
    title: config.siteTitle,
    description: config.siteDescription,
    keywords: ["個人サイト", "ポートフォリオ", "プログラミング", "技術ブログ", "Web開発"],
    authors: [{ name: "satory074" }],
    creator: "satory074",
    publisher: "satory074",
    openGraph: {
        title: config.siteTitle,
        description: config.siteDescription,
        type: "website",
        locale: "ja_JP",
        siteName: config.siteTitle,
    },
    twitter: {
        card: "summary_large_image",
        title: config.siteTitle,
        description: config.siteDescription,
        creator: "@satory074",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const person = generatePersonSchema(
        "satory074",
        "https://satory074.com",
        [
            config.profiles.github.url,
            config.profiles.hatena.url,
            config.profiles.soundcloud.url,
            config.profiles.zenn.url,
        ]
    );

    const website = generateWebSiteSchema(
        config.siteTitle,
        "https://satory074.com",
        config.siteDescription,
        person
    );

    // Cloudflare Web Analytics — Cookie 不要のプライバシー配慮解析。
    // NEXT_PUBLIC_CF_BEACON_TOKEN が入っていればビーコンを出力し、未設定なら何も出さない
    // （ビルドは壊れない＝graceful）。トークンはページソースに出る公開値なので secret ではなく
    // Amplify の環境「変数」で渡す。satory074.com は satory074.github.io とは別ホストなので
    // Cloudflare 側でも別サイト登録＝別トークンにすること。
    const cfBeaconToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

    return (
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
                />
                {cfBeaconToken && (
                    <script
                        defer
                        src="https://static.cloudflareinsights.com/beacon.min.js"
                        data-cf-beacon={JSON.stringify({ token: cfBeaconToken })}
                    />
                )}
            </head>
            <body className="min-h-screen font-sans">
                <a
                    href="#main-content"
                    className="skip-to-content"
                >
                    メインコンテンツへスキップ
                </a>
                <main id="main-content">{children}</main>
            </body>
        </html>
    );
}
