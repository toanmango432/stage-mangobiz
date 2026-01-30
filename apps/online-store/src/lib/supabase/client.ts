'use client';

/**
 * Supabase Browser Client for Next.js Client Components.
 *
 * Uses @supabase/ssr createBrowserClient which handles auth cookies via document.cookie
 * automatically. Returns a singleton — safe to call multiple times.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/services/supabase/types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'X-Client-Info': 'mango-online-store/1.0.0',
        },
      },
    }
  );
}
