/**
 * Supabase Client for Mango Online Store
 *
 * Connects to the main POS database (cpaldkcvdcdyzytosntc.supabase.co)
 * with circuit breaker pattern for resilience.
 *
 * Uses LAZY INITIALIZATION to prevent HMR/module evaluation errors.
 * The client is only created when first accessed, not at import time.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';

// Lazy-initialized Supabase client
let _supabase: SupabaseClient<Database> | null = null;

/**
 * Get or create the Supabase client (lazy initialization)
 * This is only called when the client is actually used, not at module load time.
 */
function getClient(): SupabaseClient<Database> {
  if (!_supabase) {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();

    // Warn if using placeholder credentials
    if (
      typeof window !== 'undefined' &&
      (supabaseUrl === 'https://placeholder.supabase.co' ||
        supabaseAnonKey === 'placeholder-anon-key')
    ) {
      console.error('Missing Supabase configuration. Please check your .env file.');
    }

    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      global: {
        headers: {
          'X-Client-Info': 'mango-online-store/1.0.0',
        },
      },
    });
  }
  return _supabase;
}

/**
 * Proxy-based lazy Supabase client export
 * Allows `supabase.from(...)` syntax while deferring client creation
 */
export const supabase: SupabaseClient<Database> = new Proxy(
  {} as SupabaseClient<Database>,
  {
    get(_, prop: string | symbol) {
      const client = getClient();
      const value = client[prop as keyof SupabaseClient<Database>];
      // Bind methods to the client instance
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    },
  }
);

// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailure: number | null;
  isOpen: boolean;
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailure: null,
  isOpen: false,
};

const CIRCUIT_BREAKER_CONFIG = {
  maxFailures: 5,
  resetTimeoutMs: 30000, // 30 seconds
};

/**
 * Check if circuit breaker allows requests
 */
export function isCircuitOpen(): boolean {
  if (!circuitBreaker.isOpen) return false;

  // Check if reset timeout has passed
  if (circuitBreaker.lastFailure) {
    const elapsed = Date.now() - circuitBreaker.lastFailure;
    if (elapsed >= CIRCUIT_BREAKER_CONFIG.resetTimeoutMs) {
      // Reset circuit breaker (half-open state)
      circuitBreaker.isOpen = false;
      circuitBreaker.failures = 0;
      return false;
    }
  }

  return true;
}

/**
 * Record a successful request
 */
export function recordSuccess(): void {
  circuitBreaker.failures = 0;
  circuitBreaker.isOpen = false;
}

/**
 * Record a failed request
 */
export function recordFailure(): void {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();

  if (circuitBreaker.failures >= CIRCUIT_BREAKER_CONFIG.maxFailures) {
    circuitBreaker.isOpen = true;
    console.warn('Circuit breaker opened due to repeated failures');
  }
}

/**
 * Get circuit breaker status
 */
export function getCircuitStatus(): { isOpen: boolean; failures: number } {
  return {
    isOpen: circuitBreaker.isOpen,
    failures: circuitBreaker.failures,
  };
}

/**
 * Execute a Supabase query with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  if (isCircuitOpen()) {
    return {
      data: null,
      error: {
        message: 'Service temporarily unavailable. Please try again later.',
        code: 'CIRCUIT_OPEN',
      },
    };
  }

  try {
    const result = await operation();

    if (result.error) {
      // Only count network/server errors, not client errors
      if (!result.error.code?.startsWith('PGRST') || result.error.code === 'PGRST301') {
        recordFailure();
      }
    } else {
      recordSuccess();
    }

    return result;
  } catch (error: any) {
    recordFailure();
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred',
        code: 'NETWORK_ERROR',
      },
    };
  }
}

/**
 * Create a store-scoped query helper
 * Ensures all queries are filtered by store_id for multi-tenant isolation
 */
export function createStoreQuery<T extends keyof Database['public']['Tables']>(
  table: T,
  storeId: string
) {
  return supabase.from(table).select().eq('store_id' as any, storeId);
}

/**
 * Reset the client (useful for testing or re-initialization)
 */
export function resetClient(): void {
  _supabase = null;
}

// Export default client
export default supabase;
