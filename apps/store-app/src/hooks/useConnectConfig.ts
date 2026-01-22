/**
 * useConnectConfig Hook
 * React hook to access and manage Connect integration configuration
 *
 * Usage:
 *   const { config, loading, error, updateConfig, refresh } = useConnectConfig();
 */

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectStoreId } from '@/store/slices/authSlice';
import { storeService } from '@/services/supabase/storeService';
import type { ConnectConfig } from '@/types';
import { DEFAULT_CONNECT_CONFIG } from '@/types';

interface UseConnectConfigResult {
  /** Current Connect configuration */
  config: ConnectConfig;
  /** Whether initial load is in progress */
  loading: boolean;
  /** Error if loading or updating failed */
  error: Error | null;
  /** Update config (partial update supported) */
  updateConfig: (updates: Partial<ConnectConfig>) => Promise<void>;
  /** Force refresh config from database */
  refresh: () => Promise<void>;
}

/**
 * Hook to access and manage Connect integration configuration
 * Returns default config while loading to prevent null checks
 */
export function useConnectConfig(): UseConnectConfigResult {
  // Get storeId from auth state
  const storeId = useAppSelector(selectStoreId);

  // Initialize with default config for immediate render
  const [config, setConfig] = useState<ConnectConfig>(DEFAULT_CONNECT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load config from database
   */
  const loadConfig = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const loadedConfig = await storeService.getConnectConfig(storeId);
      setConfig(loadedConfig);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load Connect config'));
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  // Load on mount and when storeId changes
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /**
   * Update configuration (partial updates supported)
   * Updates local state immediately, then persists to database
   */
  const updateConfig = useCallback(
    async (updates: Partial<ConnectConfig>) => {
      if (!storeId) {
        throw new Error('Store ID not available');
      }

      try {
        setError(null);
        // Use patchConnectConfig for partial updates
        const newConfig = await storeService.patchConnectConfig(storeId, updates);
        setConfig(newConfig);
      } catch (err) {
        const updateError = err instanceof Error ? err : new Error('Failed to update Connect config');
        setError(updateError);
        throw updateError;
      }
    },
    [storeId]
  );

  /**
   * Force refresh config from database
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    await loadConfig();
  }, [loadConfig]);

  return {
    config,
    loading,
    error,
    updateConfig,
    refresh,
  };
}

export default useConnectConfig;
