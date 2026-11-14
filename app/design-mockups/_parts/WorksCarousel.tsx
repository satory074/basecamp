"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppEntry } from "@/app/lib/types";

/**
 * 作品の横スクロール (推奨案: 自動送りなし)。
 *
 * - トラックはブラウザ標準のスクロール + scroll-snap。指・トラックパッド・キーボードでそのまま動く。
 * - 前後ボタンは本物の <button>。端では aria-disabled (フォーカスは失わない)。
 * - ボタンで移動したときだけ「3 / 11」を読み上げる。
 * - カードは複製しない (以前は無限ループのため全カードを 2 回描画していた)。
 * - 動きを減らす設定のときはスムーズスクロールしない。
 */
export default function WorksCarousel({ apps }: { apps: AppEntry[] }) {
    const trackRef = useRef<HTMLUListElement>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(apps.length <= 1);
    const [status, setStatus] = useState("");
    const pendingAnnounce = useRef(false);

    const currentIndex = useCallback(() => {
        const track = trackRef.current;
        if (!track) return 0;
        const slides = [...track.children] as HTMLElement[];
        const left = track.scrollLeft;
        let best = 0;
        slides.forEach((s, i) => {
            if (Math.abs(s.offsetLeft - track.offsetLeft - left) < Math.abs(slides[best].offsetLeft - track.offsetLeft - left)) best = i;
        });
        return best;
    }, []);

    const settle = useCallback(() => {
        const track = trackRef.current;
        if (!track) return;
        setAtStart(track.scrollLeft <= 1);
        setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 1);
        if (pendingAnnounce.current) {
            pendingAnnounce.current = false;
            setStatus(`${currentIndex() + 1} / ${apps.length}`);
        }
    }, [apps.length, currentIndex]);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        settle();
        if ("onscrollend" in window) {
            track.addEventListener("scrollend", settle);
            return () => track.removeEventListener("scrollend", settle);
        }
        let t: ReturnType<typeof setTimeout>;
        const onScroll = () => {
            clearTimeout(t);
            t = setTimeout(settle, 120);
        };
        track.addEventListener("scroll", onScroll, { passive: true });
        return () => track.removeEventListener("scroll", onScroll);
    }, [settle]);

    const go = (dir: -1 | 1) => {
        const track = trackRef.current;
        if (!track) return;
        if ((dir === -1 && atStart) || (dir === 1 && atEnd)) return;
        const slides = [...track.children] as HTMLElement[];
        const target = slides[Math.max(0, Math.min(slides.length - 1, currentIndex() + dir))];
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        pendingAnnounce.current = true;
        track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: reduce ? "auto" : "smooth" });
    };

    if (apps.length === 0) return null;

    return (
        <section className="works" aria-labelledby="works-heading" aria-roledescription="カルーセル">
            <div className="works-head">
                <h2 id="works-heading" className="section-heading">作品</h2>
                <Link href="/apps/" className="works-all">すべての作品（{apps.length}）</Link>
            </div>
            <div className="works-controls">
                <button type="button" className="icon-button" aria-label="前の作品" aria-disabled={atStart} onClick={() => go(-1)}>
                    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.75" /></svg>
                </button>
                <button type="button" className="icon-button" aria-label="次の作品" aria-disabled={atEnd} onClick={() => go(1)}>
                    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.75" /></svg>
                </button>
            </div>
            <ul ref={trackRef} className="works-track" role="list">
                {apps.map((app, i) => (
                    <li key={app.id} className="works-slide" role="group" aria-roledescription="スライド" aria-label={`${i + 1} / ${apps.length}`}>
                        <article className="app-card">
                            <Image
                                src={app.thumbnailPath}
                                alt=""
                                width={1200}
                                height={630}
                                className="app-card-thumb"
                                unoptimized={app.thumbnailPath.endsWith(".svg")}
                                loading="lazy"
                            />
                            <h3 className="app-card-name">
                                <a className="card-link" href={app.url} target="_blank" rel="noopener noreferrer">
                                    {app.name}
                                    <span className="visually-hidden">（新しいタブで開く）</span>
                                </a>
                            </h3>
                            {app.description && <p className="app-card-desc">{app.description}</p>}
                        </article>
                    </li>
                ))}
            </ul>
            <p className="visually-hidden" role="status">{status}</p>
        </section>
    );
}
