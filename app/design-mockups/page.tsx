/**
 * A 案と B 案をスマホ幅 (390×844) で明暗並べて比べるページ。
 * 1440 幅は各リンクを新しいタブで開いて確認する。
 */
const FRAMES = [
    { variant: "a", scheme: "light", label: "A 案「整頓」・ライト" },
    { variant: "a", scheme: "dark", label: "A 案「整頓」・ダーク" },
    { variant: "b", scheme: "light", label: "B 案「活動の帯」・ライト" },
    { variant: "b", scheme: "dark", label: "B 案「活動の帯」・ダーク" },
];

export default function MockupIndex() {
    return (
        <div style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif", lineHeight: 1.6 }}>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>デザイン比較</h1>
            <p style={{ marginBottom: "1rem" }}>
                本物のフィードの直近 3 日分で描いています。広い画面での見え方は各リンクから。
            </p>
            <ul style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.5rem", marginBottom: "1.5rem", listStyle: "none", padding: 0 }}>
                <li><a href="/design-mockups/a/">A 案 ホーム</a></li>
                <li><a href="/design-mockups/a/github/">A 案 GitHub ページ</a></li>
                <li><a href="/design-mockups/b/">B 案 ホーム</a></li>
                <li><a href="/design-mockups/b/github/">B 案 GitHub ページ</a></li>
            </ul>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
                {FRAMES.map((f) => (
                    <figure key={`${f.variant}-${f.scheme}`} style={{ margin: 0 }}>
                        <figcaption style={{ marginBottom: "0.5rem", fontWeight: 600 }}>{f.label}</figcaption>
                        <iframe
                            src={`/design-mockups/${f.variant}/?scheme=${f.scheme}`}
                            title={f.label}
                            width={390}
                            height={844}
                            style={{ border: "1px solid #888", borderRadius: 12, background: "#fff" }}
                        />
                    </figure>
                ))}
            </div>
        </div>
    );
}
