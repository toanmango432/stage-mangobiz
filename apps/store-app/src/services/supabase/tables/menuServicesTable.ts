/**
 * Menu Services Table Operations
 * CRUD operations for the menu_services table in Supabase
 */

import { supabase } from '../client';
import type {
  MenuServiceRow,
  MenuServiceInsert,
  MenuServiceUpdate,
} from '../types';

/**
 * Sanitize search query to prevent SQL injection via PostgREST filters
 * Escapes special characters used in PostgREST query syntax
 */
function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[\\%_'"(),.]/g, '') // Remove SQL wildcards and special chars
    .replace(/[<>]/g, '') // Remove potential XSS chars
    .trim()
    .slice(0, 100); // Limit length to prevent DoS
}

export const menuServicesTable = {
  /**
   * Get all services for a store
   * @param storeId - The store ID
   * @param includeInactive - Whether to include inactive/archived services (default: false)
   */
  async getByStoreId(
    storeId: string,
    includeInactive = false
  ): Promise<MenuServiceRow[]> {
    let query = supabase
      .from('menu_services')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false);

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query.order('display_order', {
      ascending: true,
    });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single service by ID
   */
  async getById(id: string): Promise<MenuServiceRow | null> {
    const { data, error } = await supabase
      .from('menu_services')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get services by category ID
   * @param categoryId - The category ID
   * @param includeInactive - Whether to include inactive/archived services (default: false)
   */
  async getByCategoryId(
    categoryId: string,
    includeInactive = false
  ): Promise<MenuServiceRow[]> {
    let query = supabase
      .from('menu_services')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_deleted', false);

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query.order('display_order', {
      ascending: true,
    });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new service
   */
  async create(service: MenuServiceInsert): Promise<MenuServiceRow> {
    const { data, error } = await supabase
      .from('menu_services')
      .insert(service)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing service
   */
  async update(id: string, updates: MenuServiceUpdate): Promise<MenuServiceRow> {
    const { data, error } = await supabase
      .from('menu_services')
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
   * Soft delete a service (tombstone pattern)
   * @param id - Service ID
   * @param userId - User performing the delete
   * @param deviceId - Device performing the delete
   */
  async delete(id: string, userId: string, deviceId: string): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30); // 30-day tombstone

    const { error } = await supabase
      .from('menu_services')
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
   * Archive a service (soft delete - recoverable)
   * Sets status to 'archived' while keeping the service record
   * @param id - Service ID
   * @param userId - User performing the archive
   */
  async archive(id: string, userId: string): Promise<MenuServiceRow> {
    const { data, error } = await supabase
      .from('menu_services')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        archived_by: userId,
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
   * Restore an archived service
   * Sets status back to 'active' and clears archive fields
   * @param id - Service ID
   */
  async restore(id: string): Promise<MenuServiceRow> {
    const { data, error } = await supabase
      .from('menu_services')
      .update({
        status: 'active',
        archived_at: null,
        archived_by: null,
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
   * Search services by name, description, or tags
   * @param storeId - The store ID
   * @param query - Search query
   * @param limit - Maximum number of results (default: 50)
   */
  async search(
    storeId: string,
    query: string,
    limit = 50
  ): Promise<MenuServiceRow[]> {
    const sanitizedQuery = sanitizeSearchQuery(query);
    if (!sanitizedQuery) return [];

    // Search by name (most common)
    const { data, error } = await supabase
      .from('menu_services')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('status', 'active')
      .ilike('name', `%${sanitizedQuery}%`)
      .order('display_order', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get services updated since a specific time (for sync)
   * Includes deleted services for sync propagation
   */
  async getUpdatedSince(
    storeId: string,
    since: Date
  ): Promise<MenuServiceRow[]> {
    const { data, error } = await supabase
      .from('menu_services')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert services (for sync)
   */
  async upsertMany(services: MenuServiceInsert[]): Promise<MenuServiceRow[]> {
    const { data, error } = await supabase
      .from('menu_services')
      .upsert(services, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Update display order for multiple services (batch reorder)
   */
  async updateDisplayOrder(
    updates: Array<{ id: string; displayOrder: number }>
  ): Promise<void> {
    // Supabase doesn't have batch update, so we do individual updates
    const promises = updates.map(({ id, displayOrder }) =>
      supabase
        .from('menu_services')
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
   * Get services available for online booking
   */
  async getOnlineBookingServices(storeId: string): Promise<MenuServiceRow[]> {
    const { data, error } = await supabase
      .from('menu_services')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('status', 'active')
      .eq('online_booking_enabled', true)
      .in('booking_availability', ['online', 'both'])
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get services with variants (hasVariants = true)
   */
  async getServicesWithVariants(storeId: string): Promise<MenuServiceRow[]> {
    const { data, error } = await supabase
      .from('menu_services')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('status', 'active')
      .eq('has_variants', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get archived services only
   */
  async getArchivedServices(storeId: string): Promise<MenuServiceRow[]> {
    const { data, error } = await supabase
      .from('menu_services')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('status', 'archived')
      .order('archived_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Hard delete a service (permanent - use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('menu_services')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Update variant count for a service
   * Called when variants are added/removed
   */
  async updateVariantCount(id: string, count: number): Promise<MenuServiceRow> {
    const { data, error } = await supabase
      .from('menu_services')
      .update({
        variant_count: count,
        has_variants: count > 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
