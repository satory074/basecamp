"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsDark(document.documentElement.classList.contains("dark"));
    }, []);

    const toggleTheme = () => {
        document.documentElement.classList.toggle("dark");
        setIsDark(!isDark);
    };

    if (!mounted) {
        return null;
    }

    return (
        <button
            onClick={toggleTheme}
            className="site-nav__button"
            aria-label={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
        >
            <span className="site-nav__icon">{isDark ? "🌙" : "☀️"}</span>
            <span className="site-nav__label">{isDark ? "ライト" : "ダーク"}</span>
        </button>
    );
}
