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

  // Security headers for all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
