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
                <meta
                    name="description"
                    content="デジタル庁のベストプラクティスに基づいた、アクセシビリティに配慮した個人用ホームページです。"
                />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            try {
                                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                                    document.documentElement.classList.add('dark')
                                }
                            } catch (_) {}
                        `,
                    }}
                />
            </head>
            <body suppressHydrationWarning className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <div className="skip-link">
                    <a href="#main-content">メインコンテンツへスキップ</a>
                </div>
                <Header />
                <main id="main-content">{children}</main>
                <footer className="mt-8 py-6 text-center text-gray-600 dark:text-gray-400">
                    <p suppressHydrationWarning>© {new Date().getFullYear()} Basecamp. All rights reserved.</p>
                </footer>
            </body>
        </html>
    );
}
