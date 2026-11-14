"use client";

import { useEffect } from "react";

/**
 * モックアップ専用: ?scheme=light|dark で配色を固定する (OS の設定を変えずに比べるため)。
 * トークンは light-dark() で書いてあるので、color-scheme を変えるだけで切り替わる。
 */
export default function SchemeFromQuery() {
    useEffect(() => {
        const scheme = new URLSearchParams(window.location.search).get("scheme");
        if (scheme === "light" || scheme === "dark") {
            document.documentElement.style.colorScheme = scheme;
            document.documentElement.dataset.scheme = scheme;
        }
    }, []);
    return null;
}
