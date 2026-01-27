import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
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
};

export default nextConfig;
