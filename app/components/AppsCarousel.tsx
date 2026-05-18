"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import type { AppEntry } from "../lib/types";

interface AppsCarouselProps {
    apps: AppEntry[];
}

const ADVANCE_INTERVAL_MS = 3000;

export default function AppsCarousel({ apps }: AppsCarouselProps) {
    const isSpotlight = apps.length === 1;
    const viewportRef = useRef<HTMLDivElement>(null);
    const pausedRef = useRef(false);
    const reducedMotionRef = useRef(false);

    const step = useCallback((direction: 1 | -1) => {
        const vp = viewportRef.current;
        if (!vp) return;
        const track = vp.firstElementChild as HTMLElement | null;
        const firstCard = vp.querySelector<HTMLElement>(".app-carousel-card");
        if (!track || !firstCard) return;
        const gap = parseFloat(getComputedStyle(track).gap || "0");
        const stride = firstCard.offsetWidth + gap;
        const halfWidth = track.scrollWidth / 2;
        const current = vp.scrollLeft;
        if (direction === 1) {
            if (current >= halfWidth - 1) {
                vp.scrollTo({ left: current - halfWidth, behavior: "instant" as ScrollBehavior });
                requestAnimationFrame(() => {
                    vp.scrollTo({ left: vp.scrollLeft + stride, behavior: "smooth" });
                });
            } else {
                vp.scrollTo({ left: current + stride, behavior: "smooth" });
            }
        } else {
            if (current <= 1) {
                vp.scrollTo({ left: halfWidth, behavior: "instant" as ScrollBehavior });
                requestAnimationFrame(() => {
                    vp.scrollTo({ left: vp.scrollLeft - stride, behavior: "smooth" });
                });
            } else {
                vp.scrollTo({ left: current - stride, behavior: "smooth" });
            }
        }
    }, []);

    useEffect(() => {
        if (isSpotlight) return;
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => {
            reducedMotionRef.current = mq.matches;
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
        };
        const resume = () => {
            pausedRef.current = false;
        };
        vp.addEventListener("mouseenter", pause);
        vp.addEventListener("mouseleave", resume);
        vp.addEventListener("focusin", pause);
        vp.addEventListener("focusout", resume);

        const tick = () => {
            if (pausedRef.current || reducedMotionRef.current) return;
            step(1);
        };

        const id = window.setInterval(tick, ADVANCE_INTERVAL_MS);
        return () => {
            window.clearInterval(id);
            vp.removeEventListener("mouseenter", pause);
            vp.removeEventListener("mouseleave", resume);
            vp.removeEventListener("focusin", pause);
            vp.removeEventListener("focusout", resume);
        };
    }, [isSpotlight, step]);

    if (apps.length === 0) return null;

    const renderCard = (app: AppEntry, isClone = false) => (
        <a
            key={isClone ? `${app.id}-clone` : app.id}
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="app-carousel-card"
            {...(isClone
                ? { "aria-hidden": true, tabIndex: -1 }
                : { role: "listitem", "aria-label": `${app.name}を新しいタブで開く` })}
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
    );

    return (
        <section
            className={`apps-carousel${isSpotlight ? " apps-carousel-spotlight" : ""}`}
            aria-label="作品"
            aria-roledescription="カルーセル"
        >
            <div className="apps-carousel-header">
                <h2>作品</h2>
                {!isSpotlight && (
                    <Link href="/apps" className="apps-carousel-btn apps-carousel-viewall">
                        すべて見る →
                    </Link>
                )}
            </div>
            <div className="apps-carousel-body">
                {!isSpotlight && (
                    <button
                        type="button"
                        className="apps-carousel-edge apps-carousel-edge-prev"
                        onClick={() => step(-1)}
                        aria-label="前のスライド"
                    >
                        ‹
                    </button>
                )}
                <div
                    ref={viewportRef}
                    className="apps-carousel-viewport"
                    tabIndex={isSpotlight ? -1 : 0}
                    role={isSpotlight ? undefined : "group"}
                    aria-label={isSpotlight ? undefined : "作品スライド (←/→ キーで操作)"}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowLeft") {
                            e.preventDefault();
                            step(-1);
                        } else if (e.key === "ArrowRight") {
                            e.preventDefault();
                            step(1);
                        }
                    }}
                >
                    <div className="apps-carousel-track" role="list">
                        {apps.map((app) => renderCard(app))}
                        {!isSpotlight && apps.map((app) => renderCard(app, true))}
                    </div>
                </div>
                {!isSpotlight && (
                    <button
                        type="button"
                        className="apps-carousel-edge apps-carousel-edge-next"
                        onClick={() => step(1)}
                        aria-label="次のスライド"
                    >
                        ›
                    </button>
                )}
            </div>
        </section>
    );
}
