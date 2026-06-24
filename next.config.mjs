/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow-list the remote hosts we serve imagery from. (Today the app uses
    // plain <img> tags, so this only takes effect if/when next/image is adopted
    // — keeping it scoped avoids an open image-optimization proxy.)
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
  experimental: {
    // Server Actions are stable in Next 14.2; raise the body limit for slip/doc uploads.
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;
