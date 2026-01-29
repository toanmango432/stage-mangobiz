/**
 * Catalog Settings Table Operations
 * CRUD operations for the catalog_settings table in Supabase
 * Note: This is a one-per-store settings table (UNIQUE constraint on store_id)
 */

import { supabase } from '../client';
import type {
  CatalogSettingsRow,
  CatalogSettingsInsert,
  CatalogSettingsUpdate,
} from '../types';

export const catalogSettingsTable = {
  /**
   * Get settings for a store
   * @param storeId - The store ID
   * @returns Settings or null if not found
   */
  async get(storeId: string): Promise<CatalogSettingsRow | null> {
    const { data, error } = await supabase
      .from('catalog_settings')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get or create settings for a store
   * Creates default settings if none exist
   * @param storeId - The store ID
   * @param tenantId - The tenant ID for new settings
   * @param userId - User creating settings (optional)
   * @param deviceId - Device creating settings (optional)
   */
  async getOrCreate(
    storeId: string,
    tenantId: string,
    userId?: string,
    deviceId?: string
  ): Promise<CatalogSettingsRow> {
    // Try to get existing settings
    const existing = await this.get(storeId);
    if (existing) return existing;

    // Create default settings
    const defaultSettings: CatalogSettingsInsert = {
      tenant_id: tenantId,
      store_id: storeId,
      // Duration defaults
      default_duration: 30,
      default_extra_time: 0,
      default_extra_time_type: 'processing',
      // Pricing defaults
      default_tax_rate: 0,
      currency: 'USD',
      currency_symbol: '$',
      // Online booking defaults
      show_prices_online: true,
      require_deposit_for_online_booking: false,
      default_deposit_percentage: 50,
      // Feature toggles - all enabled by default
      enable_packages: true,
      enable_add_ons: true,
      enable_variants: true,
      allow_custom_pricing: true,
      booking_sequence_enabled: false,
      // Sync metadata
      sync_status: 'local',
      version: 1,
      vector_clock: {},
      last_synced_version: 0,
      // Audit
      created_by: userId || null,
      created_by_device: deviceId || null,
    };

    const { data, error } = await supabase
      .from('catalog_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update settings for a store
   * @param storeId - The store ID
   * @param updates - Settings updates
   */
  async update(
    storeId: string,
    updates: CatalogSettingsUpdate
  ): Promise<CatalogSettingsRow> {
    const { data, error } = await supabase
      .from('catalog_settings')
      .update({
        ...updates,
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update settings by ID
   * @param id - The settings ID
   * @param updates - Settings updates
   */
  async updateById(
    id: string,
    updates: CatalogSettingsUpdate
  ): Promise<CatalogSettingsRow> {
    const { data, error } = await supabase
      .from('catalog_settings')
      .update({
        ...updates,
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get settings updated since a specific time (for sync)
   */
  async getUpdatedSince(
    storeId: string,
    since: Date
  ): Promise<CatalogSettingsRow[]> {
    const { data, error } = await supabase
      .from('catalog_settings')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString());

    if (error) throw error;
    return data || [];
  },

  /**
   * Upsert settings (for sync)
   */
  async upsert(settings: CatalogSettingsInsert): Promise<CatalogSettingsRow> {
    const { data, error } = await supabase
      .from('catalog_settings')
      .upsert(settings, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Feature toggle helpers

  /**
   * Enable packages feature
   */
  async enablePackages(storeId: string): Promise<CatalogSettingsRow> {
    return this.update(storeId, { enable_packages: true });
  },

  /**
   * Disable packages feature
   */
  async disablePackages(storeId: string): Promise<CatalogSettingsRow> {
    return this.update(storeId, { enable_packages: false });
  },

  /**
   * Enable add-ons feature
   */
  async enableAddOns(storeId: string): Promise<CatalogSettingsRow> {
    return this.update(storeId, { enable_add_ons: true });
  },

  /**
   * Disable add-ons feature
   */
  async disableAddOns(storeId: string): Promise<CatalogSettingsRow> {
    return this.update(storeId, { enable_add_ons: false });
  },

  /**
   * Enable variants feature
   */
  async enableVariants(storeId: string): Promise<CatalogSettingsRow> {
    return this.update(storeId, { enable_variants: true });
  },

  /**
   * Disable variants feature
   */
  async disableVariants(storeId: string): Promise<CatalogSettingsRow> {
    return this.update(storeId, { enable_variants: false });
  },

  /**
   * Enable booking sequence feature
   */
  async enableBookingSequence(storeId: string): Promise<CatalogSettingsRow> {
    return this.update(storeId, { booking_sequence_enabled: true });
  },

  /**
   * Disable booking sequence feature
   */
  async disableBookingSequence(storeId: string): Promise<CatalogSettingsRow> {
    return this.update(storeId, { booking_sequence_enabled: false });
  },

  /**
   * Update tax rate
   */
  async updateTaxRate(
    storeId: string,
    taxRate: number
  ): Promise<CatalogSettingsRow> {
    return this.update(storeId, { default_tax_rate: taxRate });
  },

  /**
   * Update default deposit percentage
   */
  async updateDefaultDeposit(
    storeId: string,
    depositPercentage: number
  ): Promise<CatalogSettingsRow> {
    return this.update(storeId, { default_deposit_percentage: depositPercentage });
  },

  /**
   * Update currency settings
   */
  async updateCurrency(
    storeId: string,
    currency: string,
    currencySymbol: string
  ): Promise<CatalogSettingsRow> {
    return this.update(storeId, { currency, currency_symbol: currencySymbol });
  },

  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(
    storeId: string,
    feature: 'packages' | 'add_ons' | 'variants' | 'custom_pricing' | 'booking_sequence'
  ): Promise<boolean> {
    const settings = await this.get(storeId);
    if (!settings) return true; // Default to enabled if no settings

    const featureMap: Record<string, keyof CatalogSettingsRow> = {
      packages: 'enable_packages',
      add_ons: 'enable_add_ons',
      variants: 'enable_variants',
      custom_pricing: 'allow_custom_pricing',
      booking_sequence: 'booking_sequence_enabled',
    };

    return Boolean(settings[featureMap[feature]]);
  },
};
