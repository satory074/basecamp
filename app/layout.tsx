// app/layout.tsx
import type { Metadata } from "next";
import Header from "./components/Header";
import "./globals.css";

export const metadata: Metadata = {
    title: "Basecamp - Personal Homepage",
    description: "個人用ホームページ。デジタル庁のベストプラクティスを踏まえたシンプルで使いやすいサイトです。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja" suppressHydrationWarning>
            <head>
                <meta name="Content-Security-Policy" content="frame-src 'self' https://w.soundcloud.com;" />
            </head>
            <body className="bg-white text-gray-800" suppressHydrationWarning>
                <Header />
                {children}
            </body>
        </html>
    );
}
