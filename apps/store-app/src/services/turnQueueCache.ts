/**
 * Turn Queue Result Cache
 * Simple in-memory cache for turn queue calculation results to avoid
 * recalculating on every request. Uses a 30-second TTL for freshness.
 */

import type { Staff } from '../types';

/** Cache entry with result and timestamp */
interface CacheEntry {
  result: Staff | null;
  timestamp: number;
}

/** Time-to-live for cache entries (30 seconds) */
const CACHE_TTL_MS = 30000;

/**
 * In-memory cache for turn queue results.
 * Keys are composite: `${storeId}:${criteriaHash}`
 */
class TurnQueueCache {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Get cached result for a key.
   * Returns undefined if not cached or expired.
   */
  get(key: string): Staff | null | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;
    if (isExpired) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.result;
  }

  /**
   * Store a result in the cache with current timestamp.
   */
  set(key: string, result: Staff | null): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate all cache entries for a specific store.
   * Call this when tickets or staff status changes.
   */
  invalidate(storeId: string): void {
    // Remove all entries that start with the storeId prefix
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${storeId}:`)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Clear all cache entries. Useful for testing.
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const turnQueueCache = new TurnQueueCache();

/**
 * Invalidate turn queue cache for a store.
 * Export this function to allow external callers to trigger cache invalidation
 * when tickets are created/updated or staff status changes.
 */
export function invalidateTurnQueueCache(storeId: string): void {
  turnQueueCache.invalidate(storeId);
}
