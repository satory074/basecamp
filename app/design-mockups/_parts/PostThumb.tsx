"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * カードのサムネイル。タイトルが同じカードにあるので画像は装飾扱い (alt="")。
 * 読み込みに失敗したら、プラットフォーム色の面だけを出す (CSS 側で --platform を使う)。
 */
export default function PostThumb({ src, shape }: { src?: string; shape: "square" | "portrait" }) {
    const [failed, setFailed] = useState(false);
    const width = 64;
    const height = shape === "portrait" ? 90 : 64;

    if (!src || failed) {
        return <span className="post-thumb post-thumb-empty" data-shape={shape} aria-hidden="true" />;
    }
    return (
        <Image
            className="post-thumb"
            data-shape={shape}
            src={src.replace(/^http:/, "https:")}
            alt=""
            width={width}
            height={height}
            loading="lazy"
            onError={() => setFailed(true)}
        />
    );
}
