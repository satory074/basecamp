/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
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
        hostname: 'img.shields.io',
      },
    ],
  },
};

export default nextConfig;
