// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";

export const metadata: Metadata = {
    title: "Basecamp - Personal Homepage",
    description: "個人用ホームページ。デジタル庁のベストプラクティスを踏まえたシンプルで使いやすいサイトです。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
            <body className="bg-white text-gray-800">
                <Header />
                {children}
            </body>
        </html>
    );
}
