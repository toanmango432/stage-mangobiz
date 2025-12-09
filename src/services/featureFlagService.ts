/**
 * Feature Flag Service
 * Fetches feature flags from Supabase and checks if features are enabled
 * for the current store's license tier.
 */

import { supabase } from './supabase/client';
import { storeAuthManager } from './storeAuthManager';

export type LicenseTier = 'free' | 'basic' | 'professional' | 'enterprise';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  globallyEnabled: boolean;
  enabledForFree: boolean;
  enabledForBasic: boolean;
  enabledForProfessional: boolean;
  enabledForEnterprise: boolean;
  rolloutPercentage: number;
  metadata: Record<string, any>;
}

// Cache for feature flags
let flagsCache: FeatureFlag[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {} as any);
}

/**
 * Fetch all feature flags from Supabase
 */
async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (flagsCache.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return flagsCache;
  }

  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('key');

    if (error) {
      console.error('Failed to fetch feature flags:', error);
      return flagsCache; // Return stale cache on error
    }

    flagsCache = (data || []).map(toCamelCase);
    lastFetchTime = now;

    // Also store in localStorage for offline access
    try {
      localStorage.setItem('mango_feature_flags', JSON.stringify(flagsCache));
      localStorage.setItem('mango_feature_flags_time', String(now));
    } catch {
      // Ignore localStorage errors
    }

    return flagsCache;
  } catch (error) {
    console.error('Error fetching feature flags:', error);

    // Try to load from localStorage for offline support
    if (flagsCache.length === 0) {
      try {
        const stored = localStorage.getItem('mango_feature_flags');
        if (stored) {
          flagsCache = JSON.parse(stored);
        }
      } catch {
        // Ignore localStorage errors
      }
    }

    return flagsCache;
  }
}

/**
 * Get current license tier from store auth
 */
function getCurrentTier(): LicenseTier {
  const state = storeAuthManager.getState();
  const tier = state.store?.tier?.toLowerCase() as LicenseTier;
  return tier || 'basic';
}

/**
 * Check if a feature is enabled for a specific tier
 */
function isEnabledForTier(flag: FeatureFlag, tier: LicenseTier): boolean {
  if (!flag.globallyEnabled) return false;

  switch (tier) {
    case 'free':
      return flag.enabledForFree;
    case 'basic':
      return flag.enabledForBasic;
    case 'professional':
      return flag.enabledForProfessional;
    case 'enterprise':
      return flag.enabledForEnterprise;
    default:
      return false;
  }
}

/**
 * Check if a feature is enabled for the current store
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const flags = await fetchFeatureFlags();
  const flag = flags.find(f => f.key === key);

  if (!flag) {
    console.warn(`Feature flag "${key}" not found`);
    return false;
  }

  const tier = getCurrentTier();
  return isEnabledForTier(flag, tier);
}

/**
 * Synchronous check using cached flags
 * Use this in render methods where async isn't practical
 */
export function isFeatureEnabledSync(key: string): boolean {
  // Load from cache or localStorage
  if (flagsCache.length === 0) {
    try {
      const stored = localStorage.getItem('mango_feature_flags');
      if (stored) {
        flagsCache = JSON.parse(stored);
      }
    } catch {
      // Ignore errors
    }
  }

  const flag = flagsCache.find(f => f.key === key);
  if (!flag) return false;

  const tier = getCurrentTier();
  return isEnabledForTier(flag, tier);
}

/**
 * Get all enabled features for the current store
 */
export async function getEnabledFeatures(): Promise<FeatureFlag[]> {
  const flags = await fetchFeatureFlags();
  const tier = getCurrentTier();

  return flags.filter(flag => isEnabledForTier(flag, tier));
}

/**
 * Force refresh the cache
 */
export async function refreshFeatureFlags(): Promise<FeatureFlag[]> {
  lastFetchTime = 0; // Invalidate cache
  return fetchFeatureFlags();
}

/**
 * Get a specific feature flag
 */
export async function getFeatureFlag(key: string): Promise<FeatureFlag | null> {
  const flags = await fetchFeatureFlags();
  return flags.find(f => f.key === key) || null;
}

/**
 * Feature flag service singleton
 */
export const featureFlagService = {
  isFeatureEnabled,
  isFeatureEnabledSync,
  getEnabledFeatures,
  refreshFeatureFlags,
  getFeatureFlag,
  getCurrentTier,
};

export default featureFlagService;
