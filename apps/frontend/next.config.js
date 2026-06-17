const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // REMOVED: output: 'export'
  // Static export mode disables all runtime features including:
  //   - API route handlers
  //   - Server-side rendering
  //   - Dynamic route resolution
  // With it set, axios calls at runtime fail silently because Next.js
  // pre-renders the page as a static HTML file with no server to
  // proxy or serve dynamic content, causing [API Error] {} on every fetch.
  images: { unoptimized: true },
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://127.0.0.1:3001/:path*'
      }
    ]
  }
};

module.exports = nextConfig;
