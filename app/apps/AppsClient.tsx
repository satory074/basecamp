"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { AppEntry } from "../lib/types";
import FilterChips from "../components/shared/FilterChips";

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
                const haystack = [app.name, app.id, app.description ?? "", ...app.tags]
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
                まだ作品がありません。
            </div>
        );
    }

    return (
        <>
            <div className="search-box" role="search">
                <label htmlFor="apps-search" className="visually-hidden">作品を検索</label>
                <svg className="search-box-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                    <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="m10.5 10.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <input
                    id="apps-search"
                    type="search"
                    placeholder="名前・説明・タグで探す"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="search-box-input"
                    autoComplete="off"
                />
            </div>

            {allTags.length > 0 && (
                <FilterChips
                    label="タグで絞り込む（複数選べます）"
                    options={allTags.map((tag) => ({ key: tag, label: tag }))}
                    selected={[...activeTags]}
                    onToggle={toggleTag}
                />
            )}

            <p className="apps-result-count" role="status">
                {filtered.length} 件
            </p>

            {filtered.length === 0 ? (
                <p className="status-box">条件に合う作品はありません。</p>
            ) : (
                <div className="apps-grid">
                    {filtered.map((app) => (
                        // id でこのカードを直接指せる (例: /apps/#app-hyakuichi)
                        <article key={app.id} id={`app-${app.id}`} className="app-grid-card">
                            <Image
                                src={app.thumbnailPath}
                                alt=""
                                width={400}
                                height={210}
                                className="app-grid-card-thumb"
                                unoptimized={app.thumbnailPath.endsWith(".svg")}
                            />
                            <div className="app-grid-card-body">
                                {/* 名前のリンクをカード全体に広げる。リポジトリへのリンクは別に押せる (以前は <a> の中に <a> があった) */}
                                <h2 className="app-grid-card-title">
                                    <a className="card-link" href={app.url} target="_blank" rel="noopener">
                                        {app.name}
                                        <span className="visually-hidden">（新しいタブで開く）</span>
                                    </a>
                                </h2>
                                {app.description && (
                                    <p className="app-grid-card-desc">{app.description}</p>
                                )}
                                {app.tags.length > 0 && (
                                    <ul className="app-grid-card-tags" role="list" aria-label="タグ">
                                        {app.tags.slice(0, 4).map((tag) => (
                                            <li key={tag} className="app-grid-card-tag">
                                                {tag}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <p className="app-grid-card-meta">
                                    {typeof app.stars === "number" && app.stars > 0 && (
                                        <span>★ {app.stars}</span>
                                    )}
                                    <a href={app.repoUrl} target="_blank" rel="noopener noreferrer">
                                        ソースコード
                                        <span className="visually-hidden">（{app.name} の GitHub リポジトリを新しいタブで開く）</span>
                                    </a>
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </>
    );
}
