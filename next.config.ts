import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    eslint: {
        // Only run ESLint on specified directories
        dirs: ["app"],
        // Warning only, don't fail the build
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
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
        ],
    },
};

export default nextConfig;
