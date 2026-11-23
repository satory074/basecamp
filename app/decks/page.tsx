import type { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import { DECK_SECTIONS, DECKS_AS_OF, formatAsOf, type DeckItem } from "../lib/decks";

export const metadata: Metadata = pageMetadata("decks", "使っているソフトと機材、それぞれ何に使っているか");

/** 公式ページがあれば新しいタブで開くリンク、無ければ (販売終了の機材など) 名前だけ */
function DeckName({ item }: { item: DeckItem }) {
    if (!item.url) return <span className="decks-name">{item.name}</span>;
    return (
        <a className="decks-name" href={item.url} target="_blank" rel="noopener noreferrer">
            {item.name}
            {/* サイトのリンクは下線が無いので、リンクの無い機材と見分けられるように印を付ける */}
            <span className="decks-ext" aria-hidden="true">↗</span>
            <span className="visually-hidden">（新しいタブで開く）</span>
        </a>
    );
}

/** データは app/lib/decks.ts (git 管理) を import するだけ。読み込みに失敗して空になる経路は無い */
export default function DecksPage() {
    return (
        <div className="page">
            <PageHeader platform="decks" />
            <p className="decks-asof">
                <time dateTime={DECKS_AS_OF}>{formatAsOf(DECKS_AS_OF)}</time>時点
            </p>

            {DECK_SECTIONS.map((section) => (
                <section key={section.id} className="decks-section" aria-labelledby={`decks-${section.id}`}>
                    <h2 id={`decks-${section.id}`} className="section-heading">
                        {section.name}
                    </h2>
                    {section.categories.map((category) => (
                        <div key={category.id} className="decks-category">
                            <h3 className="decks-category-name">{category.name}</h3>
                            <ul className="decks-list">
                                {category.items.map((item) => (
                                    <li key={item.id} className="decks-item">
                                        <DeckName item={item} />
                                        <p className="decks-note">{item.note}</p>
                                        {item.related && (
                                            <a className="decks-related" href={item.related.href}>
                                                → {item.related.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>
            ))}
        </div>
    );
}
