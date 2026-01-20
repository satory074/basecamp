"use client";

import { useEffect } from "react";
import { config } from "../lib/config";

declare global {
    interface Window {
        twttr?: {
            widgets: {
                load: () => void;
            };
        };
    }
}

export default function XClient() {
    useEffect(() => {
        // Twitter widgets.js を動的に読み込む
        const script = document.createElement("script");
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.charset = "utf-8";
        document.body.appendChild(script);

        script.onload = () => {
            // スクリプト読み込み後にウィジェットを初期化
            if (window.twttr) {
                window.twttr.widgets.load();
            }
        };

        return () => {
            // クリーンアップ
            document.body.removeChild(script);
        };
    }, []);

    const username = config.profiles.x.username;

    return (
        <div className="x-timeline-container">
            <a
                className="twitter-timeline"
                data-theme="light"
                data-chrome="noheader nofooter noborders transparent"
                data-tweet-limit="20"
                href={`https://twitter.com/${username}`}
            >
                Loading tweets...
            </a>
        </div>
    );
}
