/**
 * Supabase Client for Business Data
 * Used for syncing clients, staff, services, appointments, tickets, transactions
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks for development
// WARNING: Remove fallbacks before production deployment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cpaldkcvdcdyzytosntc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwYWxka2N2ZGNkeXp5dG9zbnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODMzNzIsImV4cCI6MjA3OTY1OTM3Mn0.A4tG6cf7Xk5Y0eGE-Wpx5-gX62neCnuD2QlRxZ2qOOQ';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Export config for reference
export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};

/**
 * Check if Supabase connection is working
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('stores').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Get real-time channel for a store
 */
export function getStoreChannel(storeId: string) {
  return supabase.channel(`store-${storeId}`);
}
