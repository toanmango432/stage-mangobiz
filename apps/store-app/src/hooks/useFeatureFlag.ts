/**
 * useFeatureFlag Hook
 * React hook to check if a feature is enabled based on license tier
 *
 * Usage:
 *   const { isEnabled, isLoading } = useFeatureFlag('turn-tracker');
 *   if (!isEnabled) return null;
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isFeatureEnabled,
  isFeatureEnabledSync,
  refreshFeatureFlags,
  type FeatureFlag,
  getFeatureFlag,
} from '../services/featureFlagService';

interface UseFeatureFlagOptions {
  /** Default value to use while loading or if flag doesn't exist */
  defaultValue?: boolean;
}

interface UseFeatureFlagResult {
  isEnabled: boolean;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

interface UseFeatureFlagsResult {
  flags: Record<string, boolean>;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Check if a single feature is enabled
 *
 * @param key - The feature flag key (e.g., 'turn-tracker', 'offline-mode')
 * @param options - Options including defaultValue to use while loading
 * @returns Object with isEnabled boolean, loading state, and refresh function
 *
 * @example
 * function TurnTracker() {
 *   const { isEnabled, isLoading } = useFeatureFlag('turn-tracker', { defaultValue: true });
 *
 *   if (isLoading) return <Spinner />;
 *   if (!isEnabled) return null;
 *
 *   return <TurnTrackerComponent />;
 * }
 */
export function useFeatureFlag(key: string, options?: UseFeatureFlagOptions): UseFeatureFlagResult {
  const defaultValue = options?.defaultValue ?? false;

  // Start with defaultValue for predictable initial render
  // Then update based on actual feature flag check
  const [isEnabled, setIsEnabled] = useState(() => {
    // Try sync check first - if it returns true, use it
    const syncResult = isFeatureEnabledSync(key);
    if (syncResult) return true;
    // Otherwise use defaultValue (allows showing features while flags load)
    return defaultValue;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkFeature = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const enabled = await isFeatureEnabled(key);
      setIsEnabled(enabled);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check feature flag'));
      // On error, keep defaultValue
      setIsEnabled(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, defaultValue]);

  useEffect(() => {
    checkFeature();
  }, [checkFeature]);

  const refresh = useCallback(async () => {
    await refreshFeatureFlags();
    await checkFeature();
  }, [checkFeature]);

  return { isEnabled, isLoading, error, refresh };
}

/**
 * Check multiple features at once
 *
 * @param keys - Array of feature flag keys
 * @returns Object with flags map, loading state, and refresh function
 *
 * @example
 * function FeatureGatedApp() {
 *   const { flags, isLoading } = useFeatureFlags(['turn-tracker', 'offline-mode', 'loyalty']);
 *
 *   return (
 *     <>
 *       {flags['turn-tracker'] && <TurnTracker />}
 *       {flags['offline-mode'] && <OfflineToggle />}
 *       {flags['loyalty'] && <LoyaltyProgram />}
 *     </>
 *   );
 * }
 */
export function useFeatureFlags(keys: string[]): UseFeatureFlagsResult {
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    // Initialize with sync checks
    const initial: Record<string, boolean> = {};
    keys.forEach(key => {
      initial[key] = isFeatureEnabledSync(key);
    });
    return initial;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkFeatures = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const results: Record<string, boolean> = {};
      await Promise.all(
        keys.map(async key => {
          results[key] = await isFeatureEnabled(key);
        })
      );

      setFlags(results);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check feature flags'));
    } finally {
      setIsLoading(false);
    }
  }, [keys.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkFeatures();
  }, [checkFeatures]);

  const refresh = useCallback(async () => {
    await refreshFeatureFlags();
    await checkFeatures();
  }, [checkFeatures]);

  return { flags, isLoading, error, refresh };
}

/**
 * Get full feature flag details
 */
export function useFeatureFlagDetails(key: string): {
  flag: FeatureFlag | null;
  isEnabled: boolean;
  isLoading: boolean;
} {
  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isEnabled } = useFeatureFlag(key);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const flagData = await getFeatureFlag(key);
      setFlag(flagData);
      setIsLoading(false);
    }
    load();
  }, [key]);

  return { flag, isEnabled, isLoading };
}

/**
 * Simple sync check for conditional rendering
 * Use when you need immediate check without loading states
 *
 * @example
 * if (checkFeatureSync('turn-tracker')) {
 *   showTurnTracker();
 * }
 */
export function checkFeatureSync(key: string): boolean {
  return isFeatureEnabledSync(key);
}

export default useFeatureFlag;
