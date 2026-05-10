"use client";

import { useState } from "react";
import Image from "next/image";
import { platformColors } from "@/app/lib/shared/constants";

interface PlaceholderThumbnailProps {
    platform: string;
    shape?: "square" | "portrait";
}

interface ThumbnailProps {
    src?: string;
    platform: string;
    title: string;
    shape?: "square" | "portrait";
}

const SQUARE_DIMS = { width: 80, height: 80 };
const PORTRAIT_DIMS = { width: 80, height: 112 };

/**
 * プラットフォーム色のプレースホルダーサムネイル
 */
export function PlaceholderThumbnail({ platform, shape = "square" }: PlaceholderThumbnailProps) {
    const color = platformColors[platform]?.color || "#666";
    const wrapperClass = shape === "portrait"
        ? "feed-item-thumbnail-portrait feed-item-placeholder"
        : "feed-item-thumbnail feed-item-placeholder";
    return (
        <div
            className={wrapperClass}
            style={{ backgroundColor: `${color}15` }}
        >
            <div
                className="feed-item-placeholder-icon"
                style={{ backgroundColor: color }}
            />
        </div>
    );
}

/**
 * サムネイル画像コンポーネント
 * エラー時は自動的にPlaceholderThumbnailにフォールバック
 */
export function Thumbnail({ src, platform, title, shape = "square" }: ThumbnailProps) {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return <PlaceholderThumbnail platform={platform} shape={shape} />;
    }

    const dims = shape === "portrait" ? PORTRAIT_DIMS : SQUARE_DIMS;
    const wrapperClass = shape === "portrait" ? "feed-item-thumbnail-portrait" : "feed-item-thumbnail";

    // HTTPの外部画像は最適化をスキップ（Booklog等のHTTP画像対応）
    const isHttp = src.startsWith("http://");

    return (
        <div className={wrapperClass}>
            <Image
                src={src}
                alt={title || "サムネイル"}
                width={dims.width}
                height={dims.height}
                className="feed-item-thumbnail-img"
                onError={() => setHasError(true)}
                unoptimized={isHttp}
                style={{ objectFit: "cover" }}
            />
        </div>
    );
}
