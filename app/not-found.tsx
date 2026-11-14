import Link from "next/link";

export default function NotFound() {
    return (
        <div className="page">
            <header className="page-header">
                <h1 className="page-title">ページが見つかりません</h1>
                <p className="page-desc">URL が間違っているか、ページが移動した可能性があります。</p>
            </header>
            <p>
                <Link href="/" className="button">ホームへ戻る</Link>
            </p>
            <p className="status-box">
                ほかのページは、上の「すべてのページ」から一覧で開けます。
            </p>
        </div>
    );
}
