"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * カードのサムネイル。タイトルが同じカードにあるので画像は装飾扱い (alt="")。
 * 画像が無い・読み込みに失敗したときは、プラットフォーム色を薄く敷いた面だけを出す
 * (色は CSS の .post-thumb が親カードの --platform から作る)。
 */
export function Thumbnail({ src, shape = "square" }: { src?: string; shape?: "square" | "portrait" }) {
    const [failed, setFailed] = useState(false);
    const height = shape === "portrait" ? 90 : 64;

    if (!src || failed) {
        return <span className="post-thumb post-thumb-empty" data-shape={shape} aria-hidden="true" />;
    }
    return (
        <Image
            className="post-thumb"
            data-shape={shape}
            // Booklog 等の http 画像は https に寄せる (混在コンテンツで落ちるため)
            src={src.replace(/^http:/, "https:")}
            alt=""
            width={64}
            height={height}
            loading="lazy"
            onError={() => setFailed(true)}
        />
    );
}
