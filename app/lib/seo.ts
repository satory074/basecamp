import type { Metadata } from "next";
import { config } from "./config";

/**
 * 各ページの metadata の土台。
 *
 * Next の metadata は「子ページの openGraph / twitter が親の値を丸ごと置き換える」ので、
 * 以前は下層ページで og:type・og:locale・og:site_name が消え、twitter:title は全ページホームのままだった。
 * ここで毎回全部の項目を組み立てて返す。
 *
 * - canonical / og:url はそのページ自身の URL (trailingSlash: true なので path は末尾 / で渡す)
 * - og:image は全ページ共通の 1 枚 (ページごとの画像は作らない)
 * 破ると scripts/seo-check.mjs (deploy-pages.yml のビルド後) が deploy を止める。
 */
export function buildMetadata({
    title,
    description,
    path,
}: {
    /** <title> にそのまま出す完全なタイトル */
    title: string;
    description: string;
    /** "/" や "/apps/"。先頭と末尾は / */
    path: string;
}): Metadata {
    return {
        title: { absolute: title },
        description,
        alternates: { canonical: path },
        openGraph: {
            title,
            description,
            url: path,
            type: "website",
            locale: "ja_JP",
            siteName: config.siteName,
            images: [{ url: config.ogImage, width: 1200, height: 630, alt: config.siteName }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            creator: "@satory074",
            images: [config.ogImage],
        },
    };
}

/** 下層ページのタイトルの形: 「<ページ名> | satory074」 */
export function pageTitle(label: string): string {
    return `${label} | ${config.siteName}`;
}
