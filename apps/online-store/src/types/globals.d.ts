/**
 * Global type declarations for online-store
 */

// Build-time constants injected by Vite/Next
declare const STORE_API_URL: string;
declare const __MODE__: 'development' | 'production' | 'test' | 'standalone';
declare const __MOCK_TURBULENCE__: boolean;

// Extend ImportMeta for Vite env variables
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_API_BASE_URL?: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Next.js StaticImageData compatibility
declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}
