import type { NextConfig } from "next";

const securityHeaders = [
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
    },
    {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    },
    {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin'
    },
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            // Note: 'unsafe-inline' is required for Next.js inline styles and SoundCloud widget
            // SoundCloud widget requires scripts from widget.sndcdn.com and w.soundcloud.com
            "script-src 'self' 'unsafe-inline' https://widget.sndcdn.com https://w.soundcloud.com https://connect.soundcloud.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https:",
            "media-src 'self' https:",
            "frame-src 'self' https://widget.sndcdn.com https://soundcloud.com https://w.soundcloud.com",
            "worker-src 'self' blob:",
            "child-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "block-all-mixed-content",
            "upgrade-insecure-requests"
        ].join('; ')
    }
];

const nextConfig: NextConfig = {
    // パフォーマンス最適化
    poweredByHeader: false, // X-Powered-Byヘッダーを削除

    headers: async () => {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ];
    },
    images: {
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'github.com',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'img.shields.io',
            },
            {
                protocol: 'https',
                hostname: 'cdn.zenn.dev',
            },
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: 'cdn-ak.f.st-hatena.com',
            },
            {
                protocol: 'https',
                hostname: 'cdn-ak-scissors.f.st-hatena.com',
            },
            {
                protocol: 'https',
                hostname: 'secure.gravatar.com',
            },
            {
                protocol: 'https',
                hostname: 'm.media-amazon.com',
            },
            {
                protocol: 'https',
                hostname: 'cdn.image.st-hatena.com',
            },
            {
                protocol: 'https',
                hostname: 'r2.sizu.me',
            },
            {
                protocol: 'https',
                hostname: 'xivapi.com',
            },
            {
                protocol: 'https',
                hostname: 'img2.finalfantasyxiv.com',
            },
            {
                protocol: 'https',
                hostname: 'image.st-booklog.jp',
            },
            {
                protocol: 'http',
                hostname: 'image.st-booklog.jp',
            },
            {
                protocol: 'https',
                hostname: 'booklog.jp',
            },
            {
                protocol: 'https',
                hostname: 'image.booklog.jp',
            },
            {
                protocol: 'https',
                hostname: 'assets.st-note.com',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: 'd2ueuvlup6lbue.cloudfront.net',
            },
            {
                protocol: 'https',
                hostname: 'i.scdn.co',
            },
        ],
    },
};

export default nextConfig;
