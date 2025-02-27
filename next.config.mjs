/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cdn.zenn.dev',
      'storage.googleapis.com',
      'cdn-ak.f.st-hatena.com',
      'cdn-ak-scissors.f.st-hatena.com',
      'secure.gravatar.com',
      'm.media-amazon.com',
      'cdn.image.st-hatena.com',
      'r2.sizu.me',
    ],
    // You might need to add other domains depending on where thumbnails are hosted
  },
};

export default nextConfig;
