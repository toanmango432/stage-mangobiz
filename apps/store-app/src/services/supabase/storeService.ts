/**
 * Store Service
 * Operations for store settings including Connect integration config
 */

import { supabase } from './client';
import type { ConnectConfig } from '@/types';
import { DEFAULT_CONNECT_CONFIG } from '@/types';

/**
 * Store settings structure (subset of the full settings JSON)
 */
interface StoreSettings {
  connect_config?: ConnectConfig;
  [key: string]: unknown;
}

export const storeService = {
  /**
   * Get Connect configuration for a store
   * Returns default config if not set
   */
  async getConnectConfig(storeId: string): Promise<ConnectConfig> {
    const { data, error } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (error) {
      // PGRST116 = row not found
      if (error.code === 'PGRST116') {
        return DEFAULT_CONNECT_CONFIG;
      }
      throw error;
    }

    const settings = data?.settings as StoreSettings | null;

    if (!settings?.connect_config) {
      return DEFAULT_CONNECT_CONFIG;
    }

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_CONNECT_CONFIG,
      ...settings.connect_config,
      features: {
        ...DEFAULT_CONNECT_CONFIG.features,
        ...settings.connect_config.features,
      },
    };
  },

  /**
   * Update Connect configuration for a store
   * Merges with existing settings to preserve other config
   */
  async updateConnectConfig(storeId: string, config: ConnectConfig): Promise<void> {
    // First get existing settings to merge
    const { data: existingData, error: fetchError } = await supabase
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const existingSettings = (existingData?.settings as StoreSettings) || {};

    // Merge connect_config into existing settings
    const updatedSettings: StoreSettings = {
      ...existingSettings,
      connect_config: config,
    };

    const { error: updateError } = await supabase
      .from('stores')
      .update({
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (updateError) {
      throw updateError;
    }
  },

  /**
   * Partially update Connect configuration
   * Only updates provided fields, preserving others
   */
  async patchConnectConfig(
    storeId: string,
    updates: Partial<ConnectConfig>
  ): Promise<ConnectConfig> {
    const currentConfig = await storeService.getConnectConfig(storeId);

    const newConfig: ConnectConfig = {
      ...currentConfig,
      ...updates,
      features: {
        ...currentConfig.features,
        ...(updates.features || {}),
      },
    };

    await storeService.updateConnectConfig(storeId, newConfig);

    return newConfig;
  },
};

export default storeService;
