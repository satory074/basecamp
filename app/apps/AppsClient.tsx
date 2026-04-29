"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { AppEntry } from "../lib/types";

interface AppsClientProps {
    apps: AppEntry[];
}

export default function AppsClient({ apps }: AppsClientProps) {
    const [query, setQuery] = useState("");
    const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

    const allTags = useMemo(
        () => Array.from(new Set(apps.flatMap((a) => a.tags))).sort(),
        [apps]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return apps.filter((app) => {
            if (q) {
                const haystack = [app.name, app.description ?? "", ...app.tags]
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            if (activeTags.size > 0 && !app.tags.some((t) => activeTags.has(t))) {
                return false;
            }
            return true;
        });
    }, [apps, query, activeTags]);

    function toggleTag(tag: string) {
        setActiveTags((prev) => {
            const next = new Set(prev);
            if (next.has(tag)) next.delete(tag);
            else next.add(tag);
            return next;
        });
    }

    if (apps.length === 0) {
        return (
            <div className="apps-empty">
                まだ作品が登録されていません。GitHub repo に <code>featured-app</code> topic を付けると自動で表示されます。
            </div>
        );
    }

    return (
        <>
            <div className="apps-search-row">
                <input
                    type="search"
                    aria-label="アプリを検索"
                    placeholder="名前・説明・タグで検索..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="apps-search-input"
                />
            </div>

            {allTags.length > 0 && (
                <div className="apps-tag-filter" role="group" aria-label="タグで絞り込み">
                    {allTags.map((tag) => {
                        const active = activeTags.has(tag);
                        return (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`apps-tag-chip${active ? " active" : ""}`}
                                aria-pressed={active}
                            >
                                {tag}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="apps-result-count" aria-live="polite">
                {filtered.length} 件
            </div>

            {filtered.length === 0 ? (
                <div className="apps-empty">該当するアプリがありません</div>
            ) : (
                <div className="apps-grid">
                    {filtered.map((app) => (
                        <a
                            key={app.id}
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="app-grid-card"
                            aria-label={`${app.name}を新しいタブで開く`}
                        >
                            <Image
                                src={app.thumbnailPath}
                                alt=""
                                width={400}
                                height={210}
                                className="app-grid-card-thumb"
                                unoptimized={app.thumbnailPath.endsWith(".svg")}
                            />
                            <div className="app-grid-card-body">
                                <div className="app-grid-card-title">{app.name}</div>
                                {app.description && (
                                    <div className="app-grid-card-desc">{app.description}</div>
                                )}
                                {app.tags.length > 0 && (
                                    <div className="app-grid-card-tags">
                                        {app.tags.slice(0, 4).map((tag) => (
                                            <span key={tag} className="app-grid-card-tag">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="app-grid-card-meta">
                                    {typeof app.stars === "number" && app.stars > 0 && (
                                        <span>★ {app.stars}</span>
                                    )}
                                    <span>
                                        <a
                                            href={app.repoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            repo ↗
                                        </a>
                                    </span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </>
    );
}
