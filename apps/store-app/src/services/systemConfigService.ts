/**
 * System Config Service
 * Fetches system configuration (tax rates, payment methods, tips) from Supabase
 * for the current store's tenant.
 */

import { supabase } from './supabase/client';
import { storeAuthManager } from './storeAuthManager';

export interface TaxSetting {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'check' | 'gift_card' | 'other';
  isActive: boolean;
  sortOrder: number;
}

export interface TipSettings {
  enabled: boolean;
  presetPercentages: number[];
  allowCustom: boolean;
}

export interface SystemConfig {
  id: string;
  tenantId: string | null;
  businessType: string;
  defaultCurrency: string;
  defaultTimezone: string;
  taxSettings: TaxSetting[];
  paymentMethods: PaymentMethod[];
  tipSettings: TipSettings;
  requireClientForCheckout: boolean;
  autoPrintReceipt: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default config used when no config is available
const DEFAULT_CONFIG: Omit<SystemConfig, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> = {
  businessType: 'salon',
  defaultCurrency: 'USD',
  defaultTimezone: 'America/Los_Angeles',
  taxSettings: [
    { id: 'tax_1', name: 'Sales Tax', rate: 8.5, isDefault: true },
  ],
  paymentMethods: [
    { id: 'pay_1', name: 'Cash', type: 'cash', isActive: true, sortOrder: 1 },
    { id: 'pay_2', name: 'Credit Card', type: 'card', isActive: true, sortOrder: 2 },
    { id: 'pay_3', name: 'Debit Card', type: 'card', isActive: true, sortOrder: 3 },
    { id: 'pay_4', name: 'Gift Card', type: 'gift_card', isActive: true, sortOrder: 4 },
  ],
  tipSettings: {
    enabled: true,
    presetPercentages: [15, 18, 20, 25],
    allowCustom: true,
  },
  requireClientForCheckout: false,
  autoPrintReceipt: false,
};

// Cache for system config
let configCache: SystemConfig | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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
 * Get the current tenant ID from store auth
 */
function getCurrentTenantId(): string | null {
  const state = storeAuthManager.getState();
  return state.store?.tenantId || null;
}

/**
 * Fetch system config from Supabase
 */
async function fetchSystemConfig(): Promise<SystemConfig> {
  const now = Date.now();

  // Return cached data if still valid
  if (configCache && now - lastFetchTime < CACHE_TTL) {
    return configCache;
  }

  try {
    const tenantId = getCurrentTenantId();

    // First try tenant-specific config
    if (tenantId) {
      const { data: tenantConfig, error: tenantError } = await supabase
        .from('system_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (!tenantError && tenantConfig) {
        const config = toCamelCase(tenantConfig) as SystemConfig;
        configCache = config;
        lastFetchTime = now;
        saveToLocalStorage(config);
        return config;
      }
    }

    // Fall back to global config
    const { data: globalConfig, error: globalError } = await supabase
      .from('system_configs')
      .select('*')
      .is('tenant_id', null)
      .single();

    if (!globalError && globalConfig) {
      const config = toCamelCase(globalConfig) as SystemConfig;
      configCache = config;
      lastFetchTime = now;
      saveToLocalStorage(config);
      return config;
    }

    // If no config found, return defaults
    console.warn('No system config found, using defaults');
    return getDefaultConfig();
  } catch (error) {
    console.error('Error fetching system config:', error);
    return loadFromLocalStorage() || getDefaultConfig();
  }
}

/**
 * Get default config as SystemConfig
 */
function getDefaultConfig(): SystemConfig {
  return {
    id: 'default',
    tenantId: null,
    ...DEFAULT_CONFIG,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Save config to localStorage for offline access
 */
function saveToLocalStorage(config: SystemConfig): void {
  try {
    localStorage.setItem('mango_system_config', JSON.stringify(config));
    localStorage.setItem('mango_system_config_time', String(Date.now()));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Load config from localStorage
 */
function loadFromLocalStorage(): SystemConfig | null {
  try {
    const stored = localStorage.getItem('mango_system_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Get system config (async)
 */
export async function getSystemConfig(): Promise<SystemConfig> {
  return fetchSystemConfig();
}

/**
 * Get system config sync (from cache or localStorage)
 */
export function getSystemConfigSync(): SystemConfig {
  if (configCache) return configCache;

  const stored = loadFromLocalStorage();
  if (stored) {
    configCache = stored;
    return stored;
  }

  return getDefaultConfig();
}

/**
 * Get default tax rate
 */
export async function getDefaultTaxRate(): Promise<number> {
  const config = await getSystemConfig();
  const defaultTax = config.taxSettings.find(t => t.isDefault);
  return defaultTax?.rate ?? 0;
}

/**
 * Get default tax rate sync
 */
export function getDefaultTaxRateSync(): number {
  const config = getSystemConfigSync();
  const defaultTax = config.taxSettings.find(t => t.isDefault);
  return defaultTax?.rate ?? 0;
}

/**
 * Get active payment methods
 */
export async function getActivePaymentMethods(): Promise<PaymentMethod[]> {
  const config = await getSystemConfig();
  return config.paymentMethods
    .filter(pm => pm.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get tip settings
 */
export async function getTipSettings(): Promise<TipSettings> {
  const config = await getSystemConfig();
  return config.tipSettings;
}

/**
 * Refresh config from server
 */
export async function refreshSystemConfig(): Promise<SystemConfig> {
  lastFetchTime = 0; // Invalidate cache
  configCache = null;
  return fetchSystemConfig();
}

/**
 * System config service singleton
 */
export const systemConfigService = {
  getSystemConfig,
  getSystemConfigSync,
  getDefaultTaxRate,
  getDefaultTaxRateSync,
  getActivePaymentMethods,
  getTipSettings,
  refreshSystemConfig,
};

export default systemConfigService;
