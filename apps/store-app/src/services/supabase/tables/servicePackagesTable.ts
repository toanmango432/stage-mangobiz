/**
 * Service Packages Table Operations
 * CRUD operations for the service_packages table in Supabase
 */

import { supabase } from '../client';
import type {
  ServicePackageRow,
  ServicePackageInsert,
  ServicePackageUpdate,
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

export const servicePackagesTable = {
  /**
   * Get all packages for a store
   * @param storeId - The store ID
   * @param includeInactive - Whether to include inactive packages (default: false)
   */
  async getByStoreId(
    storeId: string,
    includeInactive = false
  ): Promise<ServicePackageRow[]> {
    let query = supabase
      .from('service_packages')
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
   * Get a single package by ID
   */
  async getById(id: string): Promise<ServicePackageRow | null> {
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create a new package
   */
  async create(pkg: ServicePackageInsert): Promise<ServicePackageRow> {
    const { data, error } = await supabase
      .from('service_packages')
      .insert(pkg)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing package
   */
  async update(id: string, updates: ServicePackageUpdate): Promise<ServicePackageRow> {
    const { data, error } = await supabase
      .from('service_packages')
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
   * Soft delete a package (tombstone pattern)
   * @param id - Package ID
   * @param userId - User performing the delete
   * @param deviceId - Device performing the delete
   */
  async delete(id: string, userId: string, deviceId: string): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30); // 30-day tombstone

    const { error } = await supabase
      .from('service_packages')
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
   * Search packages by name or description
   * @param storeId - The store ID
   * @param query - Search query
   * @param limit - Maximum number of results (default: 50)
   */
  async search(
    storeId: string,
    query: string,
    limit = 50
  ): Promise<ServicePackageRow[]> {
    const sanitizedQuery = sanitizeSearchQuery(query);
    if (!sanitizedQuery) return [];

    // Search by name (most common)
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .ilike('name', `%${sanitizedQuery}%`)
      .order('display_order', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get packages updated since a specific time (for sync)
   * Includes deleted packages for sync propagation
   */
  async getUpdatedSince(
    storeId: string,
    since: Date
  ): Promise<ServicePackageRow[]> {
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert packages (for sync)
   */
  async upsertMany(packages: ServicePackageInsert[]): Promise<ServicePackageRow[]> {
    const { data, error } = await supabase
      .from('service_packages')
      .upsert(packages, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Update display order for multiple packages (batch reorder)
   */
  async updateDisplayOrder(
    updates: Array<{ id: string; displayOrder: number }>
  ): Promise<void> {
    // Supabase doesn't have batch update, so we do individual updates
    const promises = updates.map(({ id, displayOrder }) =>
      supabase
        .from('service_packages')
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
   * Get packages available for online booking
   */
  async getOnlineBookingPackages(storeId: string): Promise<ServicePackageRow[]> {
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .eq('online_booking_enabled', true)
      .in('booking_availability', ['online', 'both'])
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Hard delete a package (permanent - use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('service_packages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Activate a package
   */
  async activate(id: string): Promise<ServicePackageRow> {
    const { data, error } = await supabase
      .from('service_packages')
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
   * Deactivate a package
   */
  async deactivate(id: string): Promise<ServicePackageRow> {
    const { data, error } = await supabase
      .from('service_packages')
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
   * Get packages by booking mode
   * @param storeId - The store ID
   * @param mode - Booking mode ('single-session' or 'multiple-visits')
   */
  async getByBookingMode(
    storeId: string,
    mode: 'single-session' | 'multiple-visits'
  ): Promise<ServicePackageRow[]> {
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .eq('booking_mode', mode)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
