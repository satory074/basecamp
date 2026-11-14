import type { Metadata } from "next";

// 見た目の比較用。検索結果には出さない (robots.txt で塞ぐと noindex が読まれないので meta で止める)
export const metadata: Metadata = {
    title: "デザイン比較 - Basecamp",
    robots: { index: false, follow: false },
    other: { "darkreader-lock": "" },
};

export default function MockupsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
