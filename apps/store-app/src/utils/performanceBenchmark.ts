/**
 * Performance Benchmarking Utilities
 * High-resolution timing for async and sync operations
 * Used to measure database operations and validate performance improvements
 */

/**
 * Measure the execution time of an async function
 * @param name - Identifier for the operation being measured
 * @param fn - Async function to measure
 * @param threshold - Optional threshold in ms; logs warning if exceeded
 * @returns The result of the async function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  threshold?: number
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    return result;
  } finally {
    const duration = performance.now() - start;
    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
    if (threshold !== undefined && duration > threshold) {
      console.warn(`[PERF WARNING] ${name} exceeded threshold (${threshold}ms): ${duration.toFixed(2)}ms`);
    }
  }
}

/**
 * Measure the execution time of a sync function
 * @param name - Identifier for the operation being measured
 * @param fn - Sync function to measure
 * @param threshold - Optional threshold in ms; logs warning if exceeded
 * @returns The result of the sync function
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  threshold?: number
): T {
  const start = performance.now();
  try {
    const result = fn();
    return result;
  } finally {
    const duration = performance.now() - start;
    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
    if (threshold !== undefined && duration > threshold) {
      console.warn(`[PERF WARNING] ${name} exceeded threshold (${threshold}ms): ${duration.toFixed(2)}ms`);
    }
  }
}
