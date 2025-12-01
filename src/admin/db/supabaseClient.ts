/**
 * Supabase Client Configuration
 * Cloud database for the Control Center
 */

import { createClient } from '@supabase/supabase-js';

// Use import.meta.env for Vite (browser) or fallback to defaults
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cpaldkcvdcdyzytosntc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwYWxka2N2ZGNkeXp5dG9zbnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODMzNzIsImV4cCI6MjA3OTY1OTM3Mn0.A4tG6cf7Xk5Y0eGE-Wpx5-gX62neCnuD2QlRxZ2qOOQ';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export config for reference
export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};
