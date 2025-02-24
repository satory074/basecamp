// app/layout.tsx
import type { Metadata } from "next";
import Header from "./components/Header";
import "./globals.css";

export const metadata: Metadata = {
    title: "Basecamp - Personal Homepage",
    description: "デジタル庁のベストプラクティスに基づいた、アクセシビリティに配慮した個人用ホームページです。",
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
                className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
                <Header />
                <main className="pt-16">{children}</main>
                <footer className="mt-auto py-6 text-center text-gray-600 dark:text-gray-400">
                    <p suppressHydrationWarning>© {new Date().getFullYear()} Basecamp. All rights reserved.</p>
                </footer>
            </body>
        </html>
    );
}
