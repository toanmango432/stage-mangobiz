import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Environment validation
 * In production, missing credentials will throw an error.
 * In development, we allow placeholder values for initial setup.
 */
function validateCredentials(): { url: string; key: string } {
  const isDev = import.meta.env.DEV;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isDev) {
      console.warn(
        '[Supabase] Missing environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
      // In development only, use placeholder that will show UI but API calls will fail gracefully
      return {
        url: 'https://placeholder.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTYxNjI0MzIsImV4cCI6MTkzMTczODQzMn0.placeholder',
      };
    }
    throw new Error(
      '[Supabase] Missing required environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY'
    );
  }
  
  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error('[Supabase] VITE_SUPABASE_URL is not a valid URL');
  }
  
  // Validate key format (JWT has 3 parts separated by dots)
  const keyParts = supabaseAnonKey.split('.');
  if (keyParts.length !== 3) {
    throw new Error('[Supabase] VITE_SUPABASE_ANON_KEY is not a valid JWT token');
  }
  
  return { url: supabaseUrl, key: supabaseAnonKey };
}

const credentials = validateCredentials();

export const supabase: SupabaseClient = createClient(
  credentials.url,
  credentials.key,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'mango-check-in',
      },
    },
  }
);

export type { SupabaseClient };
