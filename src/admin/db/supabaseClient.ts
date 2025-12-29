/**
 * Supabase Client Configuration
 * Cloud database for the Control Center
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables - REQUIRED, no fallbacks for security
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const missing = [];
  if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');
  throw new Error(
    `Missing required Supabase environment variables: ${missing.join(', ')}. ` +
    'Please check your .env file. See .env.example for required variables.'
  );
}

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export config for reference
export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};
