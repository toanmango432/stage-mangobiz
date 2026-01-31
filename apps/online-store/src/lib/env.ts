/**
 * Environment variable utilities for Next.js / Vite compatibility
 *
 * This module provides a unified way to access environment variables
 * that works in both Next.js (process.env) and Vite (import.meta.env) contexts.
 *
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anonymous key
 *
 * For Next.js:
 * - Client-accessible vars must have NEXT_PUBLIC_ prefix
 * - Server-only vars use regular names
 *
 * For Vite (tests via Vitest):
 * - All vars use VITE_ prefix
 */

// Type-safe access to import.meta.env for Vite context
type ViteEnv = Record<string, string | undefined>;

/**
 * Get an environment variable with fallback support for both Next.js and Vite
 * @param nextKey - The Next.js key (e.g., 'NEXT_PUBLIC_SUPABASE_URL')
 * @param viteKey - The Vite key (e.g., 'VITE_SUPABASE_URL')
 * @param defaultValue - Optional default value if neither is set
 */
export function getEnv(
  nextKey: string,
  viteKey: string,
  defaultValue?: string
): string | undefined {
  // Next.js environment (process.env) - works in both server and client
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[nextKey];
    if (value) return value;
  }

  // Vite environment (import.meta.env) - only available in Vite/Vitest context
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = (import.meta.env as ViteEnv)[viteKey];
    if (value) return value;
  }

  return defaultValue;
}

/**
 * Check if we're running during build time (SSR without real env vars)
 */
export function isBuildTime(): boolean {
  // During Next.js build, window is undefined and env vars may be missing
  return (
    typeof window === 'undefined' &&
    !getEnv('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL')
  );
}

// =============================================================================
// Environment variable validation
// =============================================================================

/**
 * Validates that required environment variables are set.
 * Throws an error at build/startup time if missing.
 */
function validateRequiredEnvVar(
  value: string | undefined,
  name: string
): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `Please set this in your .env.local file or deployment environment.\n` +
        `See README.md for required environment variables.`
    );
  }
  return value;
}

// =============================================================================
// Pre-defined environment variables with defaults
// =============================================================================

/**
 * Supabase URL - required for database operations
 * @throws Error if NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL is not set
 */
export function getSupabaseUrl(): string {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL');
  return validateRequiredEnvVar(url, 'NEXT_PUBLIC_SUPABASE_URL');
}

/**
 * Supabase anonymous key - required for client-side operations
 * @throws Error if NEXT_PUBLIC_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY is not set
 */
export function getSupabaseAnonKey(): string {
  const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
  return validateRequiredEnvVar(key, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Default store ID - used for single-store deployments
 */
export function getDefaultStoreId(): string {
  return (
    getEnv('NEXT_PUBLIC_DEFAULT_STORE_ID', 'VITE_DEFAULT_STORE_ID') ||
    // Default UUID for development/build
    'c0000000-0000-0000-0000-000000000001'
  );
}

/**
 * API base URL - defaults to /api/v1 for Next.js API routes
 */
export function getApiBaseUrl(): string {
  return getEnv('NEXT_PUBLIC_API_BASE_URL', 'VITE_API_BASE_URL') || '/api/v1';
}

/**
 * Site URL - used for metadata, sitemap, OG tags
 */
export function getSiteUrl(): string {
  return (
    getEnv('NEXT_PUBLIC_SITE_URL', 'VITE_SITE_URL') ||
    'https://book.mangobiz.com'
  );
}
