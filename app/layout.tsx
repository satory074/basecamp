// app/layout.tsx
import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Footer from "./components/Footer";
import Header from "./components/Header";
import WebVitals from "./components/WebVitals";
import "./globals.css";
import { config } from "./lib/config";
import { generateWebSiteSchema, generatePersonSchema } from "./lib/jsonld";

const notoSansJP = Noto_Sans_JP({
    weight: ["400", "500", "700"],
    subsets: ["latin"],
    display: "swap",
    preload: true,
    variable: "--font-noto-sans-jp",
});

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
        "https://basecamp.satory074.com",
        [
            config.profiles.github.url,
            config.profiles.twitter.url,
            config.profiles.hatena.url,
            config.profiles.soundcloud.url,
            config.profiles.zenn.url,
        ]
    );

    const website = generateWebSiteSchema(
        config.siteTitle,
        "https://basecamp.satory074.com",
        config.siteDescription,
        person
    );

    return (
        <html lang="ja" suppressHydrationWarning className={notoSansJP.variable}>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
                />
            </head>
            <body
                suppressHydrationWarning
                className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-neutral-200 flex flex-col font-sans"
            >
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded-md z-50"
                >
                    メインコンテンツへスキップ
                </a>
                <Header />
                <main id="main-content" className="flex-grow pt-16">{children}</main>
                <Footer />
                <WebVitals />
            </body>
        </html>
    );
}
