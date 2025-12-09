/**
 * useSystemConfig Hook
 * React hook to access system configuration (tax rates, payment methods, tips)
 *
 * Usage:
 *   const { config, taxRate, paymentMethods, tipSettings, isLoading } = useSystemConfig();
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getSystemConfig,
  getSystemConfigSync,
  refreshSystemConfig,
  type SystemConfig,
  type TaxSetting,
  type PaymentMethod,
  type TipSettings,
} from '../services/systemConfigService';

interface UseSystemConfigResult {
  config: SystemConfig;
  taxSettings: TaxSetting[];
  defaultTaxRate: number;
  paymentMethods: PaymentMethod[];
  activePaymentMethods: PaymentMethod[];
  tipSettings: TipSettings;
  requireClientForCheckout: boolean;
  autoPrintReceipt: boolean;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to access full system configuration
 */
export function useSystemConfig(): UseSystemConfigResult {
  // Start with sync config for instant render
  const [config, setConfig] = useState<SystemConfig>(() => getSystemConfigSync());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const freshConfig = await getSystemConfig();
      setConfig(freshConfig);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load config'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const freshConfig = await refreshSystemConfig();
    setConfig(freshConfig);
    setIsLoading(false);
  }, []);

  // Derived values
  const defaultTaxRate = config.taxSettings.find(t => t.isDefault)?.rate ?? 0;
  const activePaymentMethods = config.paymentMethods
    .filter(pm => pm.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    config,
    taxSettings: config.taxSettings,
    defaultTaxRate,
    paymentMethods: config.paymentMethods,
    activePaymentMethods,
    tipSettings: config.tipSettings,
    requireClientForCheckout: config.requireClientForCheckout,
    autoPrintReceipt: config.autoPrintReceipt,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Hook for just tax rate (lightweight)
 */
export function useTaxRate(): { taxRate: number; isLoading: boolean } {
  const [taxRate, setTaxRate] = useState(() => {
    const config = getSystemConfigSync();
    return config.taxSettings.find(t => t.isDefault)?.rate ?? 0;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const config = await getSystemConfig();
      const rate = config.taxSettings.find(t => t.isDefault)?.rate ?? 0;
      setTaxRate(rate);
      setIsLoading(false);
    }
    load();
  }, []);

  return { taxRate, isLoading };
}

/**
 * Hook for payment methods
 */
export function usePaymentMethods(): {
  paymentMethods: PaymentMethod[];
  activePaymentMethods: PaymentMethod[];
  isLoading: boolean;
} {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    return getSystemConfigSync().paymentMethods;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const config = await getSystemConfig();
      setPaymentMethods(config.paymentMethods);
      setIsLoading(false);
    }
    load();
  }, []);

  const activePaymentMethods = paymentMethods
    .filter(pm => pm.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return { paymentMethods, activePaymentMethods, isLoading };
}

/**
 * Hook for tip settings
 */
export function useTipSettings(): {
  tipSettings: TipSettings;
  isEnabled: boolean;
  presets: number[];
  allowCustom: boolean;
  isLoading: boolean;
} {
  const [tipSettings, setTipSettings] = useState<TipSettings>(() => {
    return getSystemConfigSync().tipSettings;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const config = await getSystemConfig();
      setTipSettings(config.tipSettings);
      setIsLoading(false);
    }
    load();
  }, []);

  return {
    tipSettings,
    isEnabled: tipSettings.enabled,
    presets: tipSettings.presetPercentages,
    allowCustom: tipSettings.allowCustom,
    isLoading,
  };
}

export default useSystemConfig;
