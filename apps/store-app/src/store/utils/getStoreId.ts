/**
 * Store ID Utility
 *
 * Centralized utility for retrieving the current store ID from Redux state.
 * Use this instead of inline state access to ensure consistent retrieval.
 *
 * @example
 * ```typescript
 * import { getStoreId, getStoreIdOrThrow } from '@/store/utils/getStoreId';
 *
 * // Safe retrieval (returns empty string if not available)
 * const storeId = getStoreId();
 *
 * // Strict retrieval (throws if not available)
 * const storeId = getStoreIdOrThrow();
 * ```
 *
 * See: DATA_ARCHITECTURE_REMEDIATION_PLAN.md Phase 6.1
 */

import { store } from '@/store';

/**
 * Get the current store ID from Redux state.
 * Returns empty string if no store ID is available.
 *
 * @returns The current store ID or empty string
 */
export function getStoreId(): string {
  const state = store.getState();
  return (
    state.auth.store?.storeId ||
    state.auth.storeId ||
    state.user?.activeSalonId ||
    ''
  );
}

/**
 * Get the current store ID or throw if not available.
 * Use this when store ID is required for the operation.
 *
 * @throws Error if no store ID is available
 * @returns The current store ID
 */
export function getStoreIdOrThrow(): string {
  const storeId = getStoreId();
  if (!storeId) {
    throw new Error(
      'No store ID available. User may not be logged in or store not selected.'
    );
  }
  return storeId;
}

/**
 * Check if a store ID is currently available.
 *
 * @returns true if store ID is available, false otherwise
 */
export function hasStoreId(): boolean {
  return getStoreId() !== '';
}
