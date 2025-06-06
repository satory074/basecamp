// app/layout.tsx
import type { Metadata } from "next";
import Footer from "./components/Footer";
import Header from "./components/Header";
import "./globals.css";
import { config } from "./lib/config";

export const metadata: Metadata = {
    title: config.siteTitle,
    description: config.siteDescription,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja" suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
                />
            </head>
            <body
                suppressHydrationWarning
                className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-neutral-200 flex flex-col"
            >
                <Header />
                <main className="flex-grow pt-16">{children}</main>
                <Footer />
            </body>
        </html>
    );
}
