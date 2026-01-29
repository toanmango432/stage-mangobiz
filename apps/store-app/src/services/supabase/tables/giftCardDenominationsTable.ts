/**
 * Gift Card Denominations Table Operations
 * CRUD operations for the catalog_gift_card_denominations table in Supabase
 */

import { supabase } from '../client';
import type {
  CatalogGiftCardDenominationRow,
  CatalogGiftCardDenominationInsert,
  CatalogGiftCardDenominationUpdate,
} from '../types';

export const giftCardDenominationsTable = {
  /**
   * Get all denominations for a store
   * @param storeId - The store ID
   * @param includeInactive - Whether to include inactive denominations (default: false)
   */
  async getByStoreId(
    storeId: string,
    includeInactive = false
  ): Promise<CatalogGiftCardDenominationRow[]> {
    let query = supabase
      .from('catalog_gift_card_denominations')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('display_order', {
      ascending: true,
    });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single denomination by ID
   */
  async getById(id: string): Promise<CatalogGiftCardDenominationRow | null> {
    const { data, error } = await supabase
      .from('catalog_gift_card_denominations')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get active denominations for gift card sale display
   */
  async getActiveDenominations(
    storeId: string
  ): Promise<CatalogGiftCardDenominationRow[]> {
    return this.getByStoreId(storeId, false);
  },

  /**
   * Create a new denomination
   */
  async create(
    denomination: CatalogGiftCardDenominationInsert
  ): Promise<CatalogGiftCardDenominationRow> {
    const { data, error } = await supabase
      .from('catalog_gift_card_denominations')
      .insert(denomination)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing denomination
   */
  async update(
    id: string,
    updates: CatalogGiftCardDenominationUpdate
  ): Promise<CatalogGiftCardDenominationRow> {
    const { data, error } = await supabase
      .from('catalog_gift_card_denominations')
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
   * Soft delete a denomination (tombstone pattern)
   * @param id - Denomination ID
   * @param userId - User performing the delete
   * @param deviceId - Device performing the delete
   */
  async delete(id: string, userId: string, deviceId: string): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30); // 30-day tombstone

    const { error } = await supabase
      .from('catalog_gift_card_denominations')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deleted_by_device: deviceId,
        tombstone_expires_at: tombstoneExpiresAt.toISOString(),
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Hard delete a denomination (permanent - use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('catalog_gift_card_denominations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get denominations updated since a specific time (for sync)
   */
  async getUpdatedSince(
    storeId: string,
    since: Date
  ): Promise<CatalogGiftCardDenominationRow[]> {
    const { data, error } = await supabase
      .from('catalog_gift_card_denominations')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert denominations (for sync)
   */
  async upsertMany(
    denominations: CatalogGiftCardDenominationInsert[]
  ): Promise<CatalogGiftCardDenominationRow[]> {
    const { data, error } = await supabase
      .from('catalog_gift_card_denominations')
      .upsert(denominations, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Update display order for multiple denominations (batch reorder)
   */
  async updateDisplayOrder(
    updates: Array<{ id: string; displayOrder: number }>
  ): Promise<void> {
    // Supabase doesn't have batch update, so we do individual updates
    const promises = updates.map(({ id, displayOrder }) =>
      supabase
        .from('catalog_gift_card_denominations')
        .update({
          display_order: displayOrder,
          sync_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    );

    const results = await Promise.all(promises);
    const firstError = results.find((r) => r.error);
    if (firstError?.error) throw firstError.error;
  },

  /**
   * Activate a denomination
   */
  async activate(id: string): Promise<CatalogGiftCardDenominationRow> {
    const { data, error } = await supabase
      .from('catalog_gift_card_denominations')
      .update({
        is_active: true,
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
   * Deactivate a denomination
   */
  async deactivate(id: string): Promise<CatalogGiftCardDenominationRow> {
    const { data, error } = await supabase
      .from('catalog_gift_card_denominations')
      .update({
        is_active: false,
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
   * Update denomination amount
   */
  async updateAmount(
    id: string,
    amount: number,
    label?: string | null
  ): Promise<CatalogGiftCardDenominationRow> {
    const { data, error } = await supabase
      .from('catalog_gift_card_denominations')
      .update({
        amount,
        label: label ?? null,
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
   * Create a standard set of denominations for a store
   * @param storeId - The store ID
   * @param tenantId - The tenant ID
   * @param userId - User creating denominations
   * @param deviceId - Device creating denominations
   */
  async createStandardDenominations(
    storeId: string,
    tenantId: string,
    userId?: string,
    deviceId?: string
  ): Promise<CatalogGiftCardDenominationRow[]> {
    const standardAmounts = [25, 50, 75, 100, 150, 200];

    const denominations: CatalogGiftCardDenominationInsert[] =
      standardAmounts.map((amount, index) => ({
        tenant_id: tenantId,
        store_id: storeId,
        amount,
        label: `$${amount}`,
        is_active: true,
        display_order: index,
        sync_status: 'local',
        version: 1,
        vector_clock: {},
        last_synced_version: 0,
        created_by: userId || null,
        created_by_device: deviceId || null,
      }));

    return this.upsertMany(denominations);
  },
};
