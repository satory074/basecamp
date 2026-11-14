"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * 紹介文 (bio.json、週 1 回 Gemini が生成) を 3 行で切り、溢れるときだけ「続きを読む」を出す。
 * ボタンは aria-expanded / aria-controls で開閉状態を伝える。
 */
export default function CollapsibleBio({ bio }: { bio: string }) {
    const id = useId();
    const ref = useRef<HTMLParagraphElement>(null);
    const [overflowing, setOverflowing] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const check = () => {
            if (el.dataset.expanded !== undefined) return;
            setOverflowing(el.scrollHeight > el.clientHeight + 1);
        };
        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [bio]);

    return (
        <div className="intro-bio">
            <p id={id} ref={ref} className="intro-bio-text" data-expanded={expanded ? "" : undefined}>
                {bio}
            </p>
            <div className="intro-bio-foot">
                {(overflowing || expanded) && (
                    <button
                        type="button"
                        className="text-button"
                        aria-expanded={expanded}
                        aria-controls={id}
                        onClick={() => setExpanded((v) => !v)}
                    >
                        {expanded ? "たたむ" : "続きを読む"}
                    </button>
                )}
                <p className="intro-bio-note">AI が記録から毎週書く紹介文</p>
            </div>
        </div>
    );
}
