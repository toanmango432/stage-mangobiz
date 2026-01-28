/**
 * Store Context Hook
 *
 * Provides the current store ID for data fetching.
 * In production, this would come from URL params, domain, or user session.
 */

import { useMemo } from 'react';
import { initializeRepositories } from '@/services/supabase/repositories';
import { getDefaultStoreId } from '@/lib/env';

// Default store ID - comes from environment or hardcoded default
const DEFAULT_STORE_ID = getDefaultStoreId();

/**
 * Hook to get the current store ID
 *
 * Future enhancements:
 * - Extract from subdomain (store1.mango.com)
 * - Extract from URL path (/stores/store-slug/book)
 * - Get from authenticated user's linked store
 */
export function useStore() {
  // In the future, this could come from:
  // - URL params (useParams)
  // - Subdomain parsing (window.location.hostname)
  // - User session
  const storeId = DEFAULT_STORE_ID;

  // Initialize repositories with store context
  useMemo(() => {
    if (storeId) {
      initializeRepositories(storeId);
    }
  }, [storeId]);

  return {
    storeId,
    isLoading: false,
    error: null,
  };
}

/**
 * Get store ID synchronously (for non-hook contexts)
 */
export function getStoreId(): string {
  return DEFAULT_STORE_ID;
}

export { DEFAULT_STORE_ID };
