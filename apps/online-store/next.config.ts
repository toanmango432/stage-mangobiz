import type { NextConfig } from 'next';
import path from 'path';

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)',
  },
];

const nextConfig: NextConfig = {
  // Disable Pages Router: only treat *.page.tsx as Pages Router pages.
  // App Router (src/app/) uses convention names (page.tsx, layout.tsx, etc.)
  // which are handled separately from this config in Next.js 16.
  // src/pages/ contains React view components that must not be compiled as Pages Router pages.
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js'],

  // Transpile monorepo packages that may use non-standard imports
  transpilePackages: [],

  // Path alias '@' → './src' is handled by tsconfig.json

  // Standalone output for Docker/Vercel deployment
  output: 'standalone',

  // Disable TypeScript errors during build (run separately via typecheck script)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Set turbopack root to monorepo root to avoid lockfile detection issues
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },

  // Image optimization — allow external image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },

  // Redirects for legacy routes that changed during migration
  async redirects() {
    return [
      // /book/flow was a react-router-dom <Navigate to="/book" replace /> redirect
      {
        source: '/book/flow',
        destination: '/book',
        permanent: true,
      },
    ];
  },

  // Security and caching headers
  async headers() {
    return [
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Long cache for static assets (fonts)
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Long cache for static assets (images)
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache for Next.js optimized images
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Cache for static JS/CSS bundles (already hashed by Next.js)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // No cache for API mutation routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
