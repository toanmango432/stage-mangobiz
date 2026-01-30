/**
 * Supabase Client for Mango Online Store
 *
 * Connects to the main POS database (cpaldkcvdcdyzytosntc.supabase.co)
 * with circuit breaker pattern for resilience.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getSupabaseUrl, getSupabaseAnonKey, isBuildTime } from '@/lib/env';

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

if (!isBuildTime() && typeof window !== 'undefined') {
  // Warn if real credentials are missing at runtime
  if (
    supabaseUrl === 'https://placeholder.supabase.co' ||
    supabaseAnonKey === 'placeholder-anon-key'
  ) {
    console.error('Missing Supabase configuration. Please check your .env file.');
  }
}

// Create Supabase client with auth configuration for customers
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
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
 * Validate store access (defense in depth)
 * RLS should enforce this, but we add client-side validation too
 */
export function validateStoreAccess(storeId: string): boolean {
  try {
    const allowedStores = JSON.parse(
      localStorage.getItem('mango_allowed_stores') || '[]'
    );
    return allowedStores.includes(storeId) || allowedStores.length === 0; // Empty = public access
  } catch {
    return true; // Allow if storage is unavailable
  }
}

// Export default client
export default supabase;
