import { config } from "./config";
import { sameAsUrls } from "./profiles";
import type { AppEntry } from "./types";

/**
 * 構造化データ (JSON-LD)。
 *
 * 目的は「このサイトと掲載アプリの作者は同じ 1 人 (satory074)」を機械に明示すること。
 * 掲載アプリ側も author に同じ `@id` (PERSON_ID) を書いている (docs/app-backlink.md)。
 * Google は AI 機能のための特別な schema は不要としているので、増やさない:
 * - 画面に出ている内容だけを書く (評価・レビュー・FAQ は作らない = スパム扱い)
 * - サイトリンク検索ボックス (SearchAction) は 2024-11 に廃止されたので出さない
 */
export const PERSON_ID = `${config.siteUrl}/#person`;
export const WEBSITE_ID = `${config.siteUrl}/#website`;

type JsonLd = Record<string, unknown>;

function person(): JsonLd {
    return {
        "@type": "Person",
        "@id": PERSON_ID,
        name: config.siteName,
        url: `${config.siteUrl}/`,
        // image は入れない。アバター (GitHub のアイコン) は本人の写真とは限らない (ポスター風の画像) ので、
        // 「この人の顔」として検索・AI に結び付けさせない
        description: config.profileSummary,
        jobTitle: config.role,
        sameAs: sameAsUrls(),
    };
}

/** ホームだけに置く: WebSite + Person + ProfilePage */
export function homeJsonLd(): JsonLd {
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": WEBSITE_ID,
                name: config.siteName,
                alternateName: config.siteAlternateName,
                url: `${config.siteUrl}/`,
                description: config.siteDescription,
                inLanguage: "ja",
                publisher: { "@id": PERSON_ID },
            },
            person(),
            {
                "@type": "ProfilePage",
                "@id": `${config.siteUrl}/#profilepage`,
                url: `${config.siteUrl}/`,
                name: config.siteTitle,
                inLanguage: "ja",
                isPartOf: { "@id": WEBSITE_ID },
                mainEntity: { "@id": PERSON_ID },
            },
        ],
    };
}

/** /apps/ に置く: 作品の一覧。各アプリの名前・URL・説明は画面のカードと同じもの */
export function appsJsonLd(apps: AppEntry[], pageUrl: string, name: string): JsonLd {
    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        url: pageUrl,
        name,
        inLanguage: "ja",
        isPartOf: { "@id": WEBSITE_ID },
        author: { "@type": "Person", "@id": PERSON_ID, name: config.siteName, url: `${config.siteUrl}/` },
        mainEntity: {
            "@type": "ItemList",
            numberOfItems: apps.length,
            itemListElement: apps.map((app, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                    "@type": "CreativeWork",
                    name: app.name,
                    url: app.url,
                    ...(app.description && { description: app.description }),
                    author: { "@id": PERSON_ID },
                },
            })),
        },
    };
}

/** <script type="application/ld+json"> に入れる文字列。`</script>` で抜けられないよう < を逃がす */
export function serializeJsonLd(data: JsonLd): string {
    return JSON.stringify(data).replace(/</g, "\\u003c");
}
