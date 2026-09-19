"use client";

import { useState } from "react";
import Image from "next/image";
import type { PsLibraryView } from "../lib/feeds/playstation";
import { gameAnchor, psImage } from "../lib/playstation-types";
import { formatDuration } from "../lib/shared/duration";

type Filter = "all" | "unplayed" | "played";

const FILTER_LABEL: Record<Filter, string> = { all: "すべて", unplayed: "未プレイ", played: "プレイ済み" };
const STATUS_LABEL: Record<PsLibraryView["status"], string> = { played: "プレイ済み", unplayed: "未プレイ", preorder: "予約中" };

/** 購入ライブラリ。PS4 版と PS5 版は 1 本にまとめてある */
export default function LibraryGrid({ items }: { items: PsLibraryView[] }) {
    const [filter, setFilter] = useState<Filter>("all");
    const counts: Record<Filter, number> = {
        all: items.length,
        unplayed: items.filter((i) => i.status !== "played").length,
        played: items.filter((i) => i.status === "played").length,
    };
    const visible = items.filter((i) =>
        filter === "all" ? true : filter === "played" ? i.status === "played" : i.status !== "played",
    );

    return (
        <div className="ps-library">
            <div className="ps-filter" role="group" aria-label="ライブラリの絞り込み">
                {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
                    <button
                        key={f}
                        type="button"
                        className="ps-filter-button"
                        aria-pressed={filter === f}
                        onClick={() => setFilter(f)}
                    >
                        {FILTER_LABEL[f]} <span className="ps-filter-count">{counts[f]}</span>
                    </button>
                ))}
            </div>

            <ul className="ps-library-grid">
                {visible.map((item) => {
                    const img = psImage(item.image, 240);
                    const body = (
                        <>
                            <span className="ps-library-art">
                                {img && <Image src={img} alt="" width={120} height={120} />}
                            </span>
                            <span className="ps-library-name">{item.name}</span>
                            <span className="ps-library-meta">
                                <span className={`ps-library-status is-${item.status}`}>
                                    {item.status === "played" ? formatDuration(item.seconds) : STATUS_LABEL[item.status]}
                                </span>
                                {item.platforms.join(" / ")}
                                {item.plus && " · PS Plus"}
                            </span>
                        </>
                    );
                    return (
                        <li key={item.key} className="ps-library-item">
                            {item.conceptId ? (
                                <a href={`#${gameAnchor(item.conceptId)}`} className="ps-library-link">
                                    {body}
                                </a>
                            ) : (
                                <div className="ps-library-link">{body}</div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
