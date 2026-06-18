/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',      // required for static site on Render
  trailingSlash: true,   // required for SPA routing on static host
  images: {
    unoptimized: true,   // required — Next image optimization does not work in static export mode
  },
  // rewrites() removed — incompatible with static export.
  // The frontend uses NEXT_PUBLIC_API_URL to reach the backend directly.
};

module.exports = nextConfig;
