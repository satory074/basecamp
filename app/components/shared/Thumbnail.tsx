"use client";

import { useState } from "react";
import Image from "next/image";
import { platformColors } from "@/app/lib/shared/constants";

interface PlaceholderThumbnailProps {
    platform: string;
}

interface ThumbnailProps {
    src?: string;
    platform: string;
    title: string;
    width?: number;
    height?: number;
}

/**
 * プラットフォーム色のプレースホルダーサムネイル
 */
export function PlaceholderThumbnail({ platform }: PlaceholderThumbnailProps) {
    const color = platformColors[platform]?.color || "#666";
    return (
        <div
            className="feed-item-thumbnail feed-item-placeholder"
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
export function Thumbnail({ src, platform, title, width = 80, height = 80 }: ThumbnailProps) {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return <PlaceholderThumbnail platform={platform} />;
    }

    // HTTPの外部画像は最適化をスキップ（Booklog等のHTTP画像対応）
    const isHttp = src.startsWith("http://");

    return (
        <div className="feed-item-thumbnail">
            <Image
                src={src}
                alt={title || "サムネイル"}
                width={width}
                height={height}
                className="feed-item-thumbnail-img"
                onError={() => setHasError(true)}
                unoptimized={isHttp}
                style={{ objectFit: "cover" }}
            />
        </div>
    );
}
