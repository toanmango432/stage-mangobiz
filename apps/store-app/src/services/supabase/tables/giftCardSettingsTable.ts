/**
 * Gift Card Settings Table Operations
 * CRUD operations for the catalog_gift_card_settings table in Supabase
 * Note: This is a one-per-store settings table (UNIQUE constraint on store_id)
 */

import { supabase } from '../client';
import type {
  CatalogGiftCardSettingsRow,
  CatalogGiftCardSettingsInsert,
  CatalogGiftCardSettingsUpdate,
} from '../types';

export const giftCardSettingsTable = {
  /**
   * Get gift card settings for a store
   * @param storeId - The store ID
   * @returns Settings or null if not found
   */
  async get(storeId: string): Promise<CatalogGiftCardSettingsRow | null> {
    const { data, error } = await supabase
      .from('catalog_gift_card_settings')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get or create gift card settings for a store
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
  ): Promise<CatalogGiftCardSettingsRow> {
    // Try to get existing settings
    const existing = await this.get(storeId);
    if (existing) return existing;

    // Create default settings
    const defaultSettings: CatalogGiftCardSettingsInsert = {
      tenant_id: tenantId,
      store_id: storeId,
      // Custom amount settings
      allow_custom_amount: true,
      min_amount: 10,
      max_amount: 500,
      // Expiration
      default_expiration_days: 365, // 1 year default
      // Online settings
      online_enabled: true,
      email_delivery_enabled: true,
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
      .from('catalog_gift_card_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update gift card settings for a store
   * @param storeId - The store ID
   * @param updates - Settings updates
   */
  async update(
    storeId: string,
    updates: CatalogGiftCardSettingsUpdate
  ): Promise<CatalogGiftCardSettingsRow> {
    const { data, error } = await supabase
      .from('catalog_gift_card_settings')
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
    updates: CatalogGiftCardSettingsUpdate
  ): Promise<CatalogGiftCardSettingsRow> {
    const { data, error } = await supabase
      .from('catalog_gift_card_settings')
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
  ): Promise<CatalogGiftCardSettingsRow[]> {
    const { data, error } = await supabase
      .from('catalog_gift_card_settings')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString());

    if (error) throw error;
    return data || [];
  },

  /**
   * Upsert settings (for sync)
   */
  async upsert(
    settings: CatalogGiftCardSettingsInsert
  ): Promise<CatalogGiftCardSettingsRow> {
    const { data, error } = await supabase
      .from('catalog_gift_card_settings')
      .upsert(settings, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Setting-specific update methods

  /**
   * Enable custom amount for gift cards
   */
  async enableCustomAmount(
    storeId: string
  ): Promise<CatalogGiftCardSettingsRow> {
    return this.update(storeId, { allow_custom_amount: true });
  },

  /**
   * Disable custom amount for gift cards
   */
  async disableCustomAmount(
    storeId: string
  ): Promise<CatalogGiftCardSettingsRow> {
    return this.update(storeId, { allow_custom_amount: false });
  },

  /**
   * Update custom amount limits
   */
  async updateAmountLimits(
    storeId: string,
    minAmount: number,
    maxAmount: number
  ): Promise<CatalogGiftCardSettingsRow> {
    return this.update(storeId, {
      min_amount: minAmount,
      max_amount: maxAmount,
    });
  },

  /**
   * Update default expiration days
   */
  async updateExpirationDays(
    storeId: string,
    days: number | null
  ): Promise<CatalogGiftCardSettingsRow> {
    return this.update(storeId, { default_expiration_days: days });
  },

  /**
   * Enable online gift card sales
   */
  async enableOnlineSales(storeId: string): Promise<CatalogGiftCardSettingsRow> {
    return this.update(storeId, { online_enabled: true });
  },

  /**
   * Disable online gift card sales
   */
  async disableOnlineSales(
    storeId: string
  ): Promise<CatalogGiftCardSettingsRow> {
    return this.update(storeId, { online_enabled: false });
  },

  /**
   * Enable email delivery for gift cards
   */
  async enableEmailDelivery(
    storeId: string
  ): Promise<CatalogGiftCardSettingsRow> {
    return this.update(storeId, { email_delivery_enabled: true });
  },

  /**
   * Disable email delivery for gift cards
   */
  async disableEmailDelivery(
    storeId: string
  ): Promise<CatalogGiftCardSettingsRow> {
    return this.update(storeId, { email_delivery_enabled: false });
  },

  /**
   * Check if custom amounts are allowed
   */
  async isCustomAmountAllowed(storeId: string): Promise<boolean> {
    const settings = await this.get(storeId);
    return settings?.allow_custom_amount ?? true; // Default to true if no settings
  },

  /**
   * Validate a custom gift card amount against settings
   */
  async validateAmount(storeId: string, amount: number): Promise<boolean> {
    const settings = await this.get(storeId);
    if (!settings) return true; // No settings = allow any amount

    if (!settings.allow_custom_amount) {
      return false; // Custom amounts not allowed
    }

    return amount >= settings.min_amount && amount <= settings.max_amount;
  },
};
