"use client";

import { useCallback, useRef, useState } from "react";
import type { Post } from "@/app/lib/types";

type Status = "idle" | "loading" | "ready" | "error";

// 同じ URL は 1 回だけ取りに行く (ページ内で複数の部品が呼んでも共有する)
const cache = new Map<string, Promise<Post[]>>();

function load(src: string): Promise<Post[]> {
    let p = cache.get(src);
    if (!p) {
        p = fetch(src).then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json() as Promise<Post[]>;
        });
        cache.set(src, p);
        // 失敗したらキャッシュから外し、再試行できるようにする
        p.catch(() => cache.delete(src));
    }
    return p;
}

/**
 * 最初の表示分はページの HTML に埋め込み、続きはビルド時に書き出した静的 JSON から
 * 必要になったときだけ読む。`sources` は新しい順に並んだ分割ファイル (例: 直近 → それより前)。
 *
 * - ensure(n): 先頭から n 個を読む (省略で全部)。呼ぶまで通信しない
 * - posts: 読み終えた分を順につないだもの (まだ何も読んでいなければ null)
 * - complete: すべて読み終えたか
 */
export function useLazyFeed(sources: readonly string[]) {
    const [chunks, setChunks] = useState<Post[][]>([]);
    const [status, setStatus] = useState<Status>("idle");
    const wanted = useRef(0);

    const ensure = useCallback((count: number = sources.length) => {
        const n = Math.min(count, sources.length);
        if (n <= wanted.current) return;
        wanted.current = n;
        setStatus("loading");
        Promise.all(sources.slice(0, n).map(load)).then(
            (loaded) => {
                if (wanted.current !== n) return; // より多くを頼まれた後なら、そちらの完了を待つ
                setChunks(loaded);
                setStatus("ready");
            },
            () => {
                wanted.current = 0;
                setStatus("error");
            },
        );
    }, [sources]);

    return {
        status,
        posts: chunks.length > 0 ? chunks.flat() : null,
        loadedCount: chunks.length,
        complete: chunks.length === sources.length,
        ensure,
    };
}
