/**
 * Service Variants Table Operations
 * CRUD operations for the service_variants table in Supabase
 */

import { supabase } from '../client';
import type {
  ServiceVariantRow,
  ServiceVariantInsert,
  ServiceVariantUpdate,
} from '../types';

export const serviceVariantsTable = {
  /**
   * Get all variants for a store
   * @param storeId - The store ID
   * @param includeInactive - Whether to include inactive variants (default: false)
   */
  async getByStoreId(
    storeId: string,
    includeInactive = false
  ): Promise<ServiceVariantRow[]> {
    let query = supabase
      .from('service_variants')
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
   * Get a single variant by ID
   */
  async getById(id: string): Promise<ServiceVariantRow | null> {
    const { data, error } = await supabase
      .from('service_variants')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get variants by service ID
   * @param serviceId - The service ID
   * @param includeInactive - Whether to include inactive variants (default: false)
   */
  async getByServiceId(
    serviceId: string,
    includeInactive = false
  ): Promise<ServiceVariantRow[]> {
    let query = supabase
      .from('service_variants')
      .select('*')
      .eq('service_id', serviceId)
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
   * Get the default variant for a service
   * @param serviceId - The service ID
   */
  async getDefaultVariant(serviceId: string): Promise<ServiceVariantRow | null> {
    const { data, error } = await supabase
      .from('service_variants')
      .select('*')
      .eq('service_id', serviceId)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create a new variant
   */
  async create(variant: ServiceVariantInsert): Promise<ServiceVariantRow> {
    const { data, error } = await supabase
      .from('service_variants')
      .insert(variant)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing variant
   */
  async update(id: string, updates: ServiceVariantUpdate): Promise<ServiceVariantRow> {
    const { data, error } = await supabase
      .from('service_variants')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Soft delete a variant (tombstone pattern)
   * @param id - Variant ID
   * @param userId - User performing the delete
   * @param deviceId - Device performing the delete
   */
  async delete(id: string, userId: string, deviceId: string): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30); // 30-day tombstone

    const { error } = await supabase
      .from('service_variants')
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
   * Set a variant as the default for its service
   * Clears default flag from other variants of the same service
   * @param id - Variant ID to set as default
   * @param serviceId - Service ID (to find other variants)
   */
  async setDefault(id: string, serviceId: string): Promise<ServiceVariantRow> {
    // First, clear is_default from all variants of this service
    await supabase
      .from('service_variants')
      .update({
        is_default: false,
        updated_at: new Date().toISOString(),
      })
      .eq('service_id', serviceId)
      .eq('is_deleted', false);

    // Then set the specified variant as default
    const { data, error } = await supabase
      .from('service_variants')
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get variants updated since a specific time (for sync)
   * Includes deleted variants for sync propagation
   */
  async getUpdatedSince(
    storeId: string,
    since: Date
  ): Promise<ServiceVariantRow[]> {
    const { data, error } = await supabase
      .from('service_variants')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert variants (for sync)
   */
  async upsertMany(variants: ServiceVariantInsert[]): Promise<ServiceVariantRow[]> {
    const { data, error } = await supabase
      .from('service_variants')
      .upsert(variants, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Update display order for multiple variants (batch reorder)
   */
  async updateDisplayOrder(
    updates: Array<{ id: string; displayOrder: number }>
  ): Promise<void> {
    // Supabase doesn't have batch update, so we do individual updates
    const promises = updates.map(({ id, displayOrder }) =>
      supabase
        .from('service_variants')
        .update({
          display_order: displayOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    );

    const results = await Promise.all(promises);
    const firstError = results.find((r) => r.error);
    if (firstError?.error) throw firstError.error;
  },

  /**
   * Hard delete a variant (permanent - use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('service_variants')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Delete all variants for a service
   * @param serviceId - Service ID
   * @param userId - User performing the delete
   * @param deviceId - Device performing the delete
   */
  async deleteByServiceId(serviceId: string, userId: string, deviceId: string): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30);

    const { error } = await supabase
      .from('service_variants')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deleted_by_device: deviceId,
        tombstone_expires_at: tombstoneExpiresAt.toISOString(),
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('service_id', serviceId)
      .eq('is_deleted', false);

    if (error) throw error;
  },

  /**
   * Count active variants for a service
   */
  async countByServiceId(serviceId: string): Promise<number> {
    const { count, error } = await supabase
      .from('service_variants')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', serviceId)
      .eq('is_deleted', false)
      .eq('is_active', true);

    if (error) throw error;
    return count || 0;
  },
};
