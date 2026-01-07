/**
 * Supabase Client for Mango Control Center
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: {
        'X-Client-Info': 'mango-control-center/1.0.0',
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
  resetTimeoutMs: 30000,
};

export function isCircuitOpen(): boolean {
  if (!circuitBreaker.isOpen) return false;

  if (circuitBreaker.lastFailure) {
    const elapsed = Date.now() - circuitBreaker.lastFailure;
    if (elapsed >= CIRCUIT_BREAKER_CONFIG.resetTimeoutMs) {
      circuitBreaker.isOpen = false;
      circuitBreaker.failures = 0;
      return false;
    }
  }

  return true;
}

export function recordSuccess(): void {
  circuitBreaker.failures = 0;
  circuitBreaker.isOpen = false;
}

export function recordFailure(): void {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();

  if (circuitBreaker.failures >= CIRCUIT_BREAKER_CONFIG.maxFailures) {
    circuitBreaker.isOpen = true;
    console.warn('Circuit breaker opened due to repeated failures');
  }
}

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

export default supabase;
