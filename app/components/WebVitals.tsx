"use client";

import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

export default function WebVitals() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const sendToAnalytics = (metric: any) => {
            // ここで分析サービスにメトリクスを送信
            // 例: Google Analytics 4, Vercel Analytics等
            
            // 開発環境ではコンソールに出力
            if (process.env.NODE_ENV === 'development') {
                console.log(`Web Vital: ${metric.name}`, metric);
            }

            // Google Analytics 4に送信する場合の例
            if (typeof window.gtag !== 'undefined') {
                window.gtag('event', metric.name, {
                    event_category: 'Web Vitals',
                    event_label: metric.id,
                    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
                    non_interaction: true,
                });
            }

            // カスタムイベントで送信する場合
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('web-vital', {
                    detail: metric
                }));
            }
        };

        // Core Web Vitalsを測定
        onCLS(sendToAnalytics);
        onINP(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);

    }, []);

    return null; // このコンポーネントは何もレンダリングしない
}

// Global type declaration for gtag
declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}