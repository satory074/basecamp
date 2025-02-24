import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    eslint: {
        // Only run ESLint on specified directories
        dirs: ["app"],
        // Warning only, don't fail the build
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
