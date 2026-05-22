/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: true, // disabled in dev to prevent API route interception
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/flights.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'flight-search-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 * 30 },
      },
    },
    {
      urlPattern: /\/_next\/image\?.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-image-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 7 },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);