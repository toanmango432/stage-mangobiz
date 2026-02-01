/// <reference types="vite/client" />

/**
 * Vite environment variables type definitions for online-store
 *
 * This provides type safety for import.meta.env usage in the codebase.
 * The index signature allows treating ImportMetaEnv as Record<string, string>.
 */
interface ImportMetaEnv {
  // Standard Vite env vars
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly SSR: boolean;

  // App-specific env vars
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_DEFAULT_STORE_ID?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_LOVABLE_API_KEY?: string;

  // Index signature for dynamic access and Record<string, string> compatibility
  [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
