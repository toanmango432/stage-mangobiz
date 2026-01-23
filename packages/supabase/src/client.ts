/**
 * Supabase Client for Business Data
 * Used for syncing clients, staff, services, appointments, tickets, transactions
 *
 * LOCAL-FIRST: Includes timeout wrapper and circuit breaker for resilience
 */

/// <reference types="vite/client" />

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

// ==================== CIRCUIT BREAKER CONFIG ====================

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds
const FAILURE_THRESHOLD = 3;
const CIRCUIT_RESET_MS = 30000; // 30 seconds

// Circuit breaker state
let consecutiveFailures = 0;
let circuitOpenUntil: number | null = null;

/**
 * Check if circuit breaker is open
 */
function isCircuitOpen(): boolean {
  if (circuitOpenUntil && Date.now() < circuitOpenUntil) {
    return true;
  }
  // Reset circuit if time has passed
  if (circuitOpenUntil) {
    circuitOpenUntil = null;
    consecutiveFailures = 0;
    console.log('[CircuitBreaker] Circuit CLOSED - reset after timeout');
  }
  return false;
}

/**
 * Record a successful request
 */
function recordSuccess(): void {
  consecutiveFailures = 0;
}

/**
 * Record a failed request
 */
function recordFailure(): void {
  consecutiveFailures++;
  if (consecutiveFailures >= FAILURE_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_RESET_MS;
    console.warn(`[CircuitBreaker] Circuit OPEN - ${consecutiveFailures} consecutive failures`);
  }
}

/**
 * Get circuit breaker status for debugging
 */
export function getCircuitBreakerStatus(): {
  isOpen: boolean;
  consecutiveFailures: number;
  resetAt: Date | null;
} {
  return {
    isOpen: isCircuitOpen(),
    consecutiveFailures,
    resetAt: circuitOpenUntil ? new Date(circuitOpenUntil) : null,
  };
}

/**
 * Reset circuit breaker (for testing or manual recovery)
 */
export function resetCircuitBreaker(): void {
  consecutiveFailures = 0;
  circuitOpenUntil = null;
  console.log('[CircuitBreaker] Circuit manually reset');
}

// ==================== TIMEOUT WRAPPER ====================

export class TimeoutError extends Error {
  constructor(message = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(message = 'Circuit breaker open - too many failures') {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Wrapper for Supabase operations with timeout and circuit breaker
 *
 * Usage:
 * ```typescript
 * const result = await withTimeout(async () => {
 *   return await supabase.from('clients').select('*').eq('store_id', storeId);
 * });
 * ```
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  // Check circuit breaker first
  if (isCircuitOpen()) {
    throw new CircuitBreakerOpenError();
  }

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new TimeoutError(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    const result = await Promise.race([operation(), timeoutPromise]);
    recordSuccess();
    return result;
  } catch (error) {
    if (error instanceof TimeoutError) {
      recordFailure();
    } else if (error instanceof Error && error.message.includes('fetch')) {
      // Network errors also count as failures
      recordFailure();
    }
    throw error;
  }
}

/**
 * Safe wrapper that returns null instead of throwing on circuit breaker open
 * Useful for non-critical background operations
 */
export async function withTimeoutSafe<T>(
  operation: () => Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T | null> {
  try {
    return await withTimeout(operation, timeoutMs);
  } catch (error) {
    if (error instanceof CircuitBreakerOpenError || error instanceof TimeoutError) {
      console.log('[withTimeoutSafe] Operation skipped:', error.message);
      return null;
    }
    throw error;
  }
}

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
