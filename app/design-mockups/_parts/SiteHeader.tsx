"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FEATURED_KEYS, NAV_GROUPS, isCurrent, navEntry } from "@/app/lib/navigation";
import { PLATFORMS } from "@/app/lib/platforms";

const PANEL_ID = "site-nav-panel";

// サーバーでは useLayoutEffect が警告を出すので切り替える
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface SiteHeaderProps {
    /** モックアップ専用: URL の先頭から取り除いて現在地を判定する (例: "/design-mockups/a") */
    stripPrefix?: string;
}

/**
 * 全ページ共通の 1 行ヘッダー。
 *
 * - ナビは <nav> 1 つ。全 21 ページの一覧は「すべて」ボタンで開く popover="auto"
 *   (Esc・外側クリックで閉じる、フォーカスも戻る。ブラウザ標準の動作に任せる)。
 * - 常時出すリンク (FEATURED_KEYS) は、1 行に収まるときだけ表示する。固定の
 *   ブレークポイントではなく実際の幅を測る (文字サイズを大きくしている人でも崩れない)。
 * - 現在地は aria-current="page"。色だけでなく下線と太字でも示す。
 */
export default function SiteHeader({ stripPrefix }: SiteHeaderProps) {
    const pathname = usePathname() ?? "/";
    const path = (stripPrefix && pathname.startsWith(stripPrefix) ? pathname.slice(stripPrefix.length) : pathname) || "/";
    const innerRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    // 既定は「収まらない」側 (JS が無くても一覧はパネルから辿れる)
    const [wide, setWide] = useState(false);

    // 行が収まるか測る。収まらなくなったら featured を隠し、収まる幅に戻ったら出す
    useIsoLayoutEffect(() => {
        const inner = innerRef.current;
        if (!inner) return;
        let lastWidth = 0;
        const measure = () => {
            const width = inner.clientWidth;
            // 隠れている状態で縮んだときは測り直さない (出す→測る→隠す でちらつくため)
            if (!inner.dataset.wide && width <= lastWidth) {
                lastWidth = width;
                return;
            }
            lastWidth = width;
            inner.dataset.measuring = "";
            inner.dataset.wide = "";
            const fits = inner.scrollWidth <= inner.clientWidth;
            if (!fits) delete inner.dataset.wide;
            delete inner.dataset.measuring;
            setWide(fits);
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(inner);
        return () => ro.disconnect();
    }, []);

    // Next のクライアント遷移ではページが入れ替わらないので、開いたパネルを閉じる
    useEffect(() => {
        const panel = panelRef.current;
        if (panel?.matches(":popover-open")) panel.hidePopover();
    }, [path]);

    const featured = FEATURED_KEYS.map((key) => navEntry(key)).filter((e) => e !== undefined);

    return (
        <header className="site-header">
            <div ref={innerRef} className="site-header-inner" data-wide={wide ? "" : undefined}>
                <Link href="/" className="site-name" aria-current={path === "/" ? "page" : undefined}>
                    satory074
                </Link>
                <nav className="site-nav" aria-label="サイト内">
                    <ul className="site-nav-featured" role="list">
                        {featured.map((entry) => (
                            <li key={entry.key}>
                                <Link
                                    href={entry.path}
                                    className="site-nav-link"
                                    aria-current={isCurrent(path, entry.path) ? "page" : undefined}
                                >
                                    {PLATFORMS[entry.key].label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        className="site-nav-toggle"
                        popoverTarget={PANEL_ID}
                        aria-controls={PANEL_ID}
                    >
                        すべてのページ
                    </button>
                    <div id={PANEL_ID} ref={panelRef} popover="auto" className="site-nav-panel">
                        {NAV_GROUPS.map((group) => (
                            <div key={group.id} className="site-nav-group">
                                <p id={`nav-group-${group.id}`} className="site-nav-group-label">
                                    {group.label}
                                </p>
                                <ul aria-labelledby={`nav-group-${group.id}`} role="list">
                                    {group.entries.map((entry) => (
                                        <li key={entry.key}>
                                            <Link
                                                href={entry.path}
                                                className="site-nav-panel-link"
                                                data-platform={entry.key}
                                                aria-current={isCurrent(path, entry.path) ? "page" : undefined}
                                            >
                                                <span className="site-nav-panel-name">{PLATFORMS[entry.key].label}</span>
                                                <span className="site-nav-panel-desc">{entry.description}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </nav>
            </div>
        </header>
    );
}
