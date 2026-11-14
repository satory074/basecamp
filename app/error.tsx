"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="page">
            <header className="page-header">
                <h1 className="page-title">ページを表示できませんでした</h1>
                <p className="page-desc">読み込み中に問題が起きました。もう一度試すと表示できることがあります。</p>
            </header>
            <p className="page-links">
                <button type="button" className="button" onClick={reset}>もう一度試す</button>
                <Link href="/" className="button">ホームへ戻る</Link>
            </p>
        </div>
    );
}
