"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { AppEntry } from "../lib/types";

interface AppsCarouselProps {
    apps: AppEntry[];
}

const ADVANCE_INTERVAL_MS = 5000;

export default function AppsCarousel({ apps }: AppsCarouselProps) {
    const isSpotlight = apps.length === 1;
    const viewportRef = useRef<HTMLDivElement>(null);
    const pausedRef = useRef(false);
    const reducedMotionRef = useRef(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showPlayPause, setShowPlayPause] = useState(false);

    useEffect(() => {
        pausedRef.current = isPaused;
    }, [isPaused]);

    useEffect(() => {
        if (isSpotlight) return;
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => {
            reducedMotionRef.current = mq.matches;
            setShowPlayPause(!mq.matches);
        };
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, [isSpotlight]);

    useEffect(() => {
        if (isSpotlight) return;
        const vp = viewportRef.current;
        if (!vp) return;

        const pause = () => {
            pausedRef.current = true;
            setIsPaused(true);
        };
        const resume = () => {
            pausedRef.current = false;
            setIsPaused(false);
        };
        vp.addEventListener("mouseenter", pause);
        vp.addEventListener("mouseleave", resume);
        vp.addEventListener("focusin", pause);
        vp.addEventListener("focusout", resume);

        const advance = () => {
            if (pausedRef.current || reducedMotionRef.current) return;
            const track = vp.firstElementChild as HTMLElement | null;
            const firstCard = vp.querySelector<HTMLElement>(".app-carousel-card");
            if (!track || !firstCard) return;
            const gap = parseFloat(getComputedStyle(track).gap || "0");
            const step = firstCard.offsetWidth + gap;
            const halfWidth = track.scrollWidth / 2;
            const current = vp.scrollLeft;
            // snap-back: if we've consumed the first set, jump invisibly to the equivalent
            // position in the first half before scrolling forward
            if (current >= halfWidth - 1) {
                vp.scrollTo({ left: current - halfWidth, behavior: "instant" as ScrollBehavior });
                requestAnimationFrame(() => {
                    vp.scrollTo({ left: vp.scrollLeft + step, behavior: "smooth" });
                });
            } else {
                vp.scrollTo({ left: current + step, behavior: "smooth" });
            }
        };

        const id = window.setInterval(advance, ADVANCE_INTERVAL_MS);
        return () => {
            window.clearInterval(id);
            vp.removeEventListener("mouseenter", pause);
            vp.removeEventListener("mouseleave", resume);
            vp.removeEventListener("focusin", pause);
            vp.removeEventListener("focusout", resume);
        };
    }, [isSpotlight]);

    if (apps.length === 0) return null;

    return (
        <section
            className={`apps-carousel${isSpotlight ? " apps-carousel-spotlight" : ""}`}
            aria-label="作品"
            aria-roledescription="カルーセル"
        >
            <div className="apps-carousel-header">
                <h2>作品</h2>
                <div className="apps-carousel-actions">
                    {!isSpotlight && showPlayPause && (
                        <button
                            type="button"
                            className="apps-carousel-playpause"
                            onClick={() => setIsPaused((p) => !p)}
                            aria-pressed={isPaused}
                            aria-label={isPaused ? "作品スライドを再生" : "作品スライドを一時停止"}
                        >
                            {isPaused ? "▶" : "❚❚"}
                        </button>
                    )}
                    {!isSpotlight && (
                        <Link href="/apps" className="apps-carousel-viewall">
                            すべて見る →
                        </Link>
                    )}
                </div>
            </div>
            <div ref={viewportRef} className="apps-carousel-viewport">
                <div className="apps-carousel-track" role="list">
                    {apps.map((app) => (
                        <a
                            key={app.id}
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="app-carousel-card"
                            role="listitem"
                            aria-label={`${app.name}を新しいタブで開く`}
                        >
                            <Image
                                src={app.thumbnailPath}
                                alt=""
                                width={280}
                                height={147}
                                className="app-carousel-card-thumb"
                                unoptimized={app.thumbnailPath.endsWith(".svg")}
                            />
                            <div className="app-carousel-card-body">
                                <div className="app-carousel-card-title">{app.name}</div>
                                {app.description && (
                                    <div className="app-carousel-card-desc">{app.description}</div>
                                )}
                            </div>
                        </a>
                    ))}
                    {!isSpotlight &&
                        apps.map((app) => (
                            <a
                                key={`${app.id}-clone`}
                                href={app.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="app-carousel-card"
                                aria-hidden="true"
                                tabIndex={-1}
                            >
                                <Image
                                    src={app.thumbnailPath}
                                    alt=""
                                    width={280}
                                    height={147}
                                    className="app-carousel-card-thumb"
                                    unoptimized={app.thumbnailPath.endsWith(".svg")}
                                />
                                <div className="app-carousel-card-body">
                                    <div className="app-carousel-card-title">{app.name}</div>
                                    {app.description && (
                                        <div className="app-carousel-card-desc">
                                            {app.description}
                                        </div>
                                    )}
                                </div>
                            </a>
                        ))}
                </div>
            </div>
        </section>
    );
}
