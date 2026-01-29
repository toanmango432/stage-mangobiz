/**
 * Add-On Groups Table Operations
 * CRUD operations for the add_on_groups table in Supabase
 */

import { supabase } from '../client';
import type {
  AddOnGroupRow,
  AddOnGroupInsert,
  AddOnGroupUpdate,
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

export const addOnGroupsTable = {
  /**
   * Get all add-on groups for a store
   * @param storeId - The store ID
   * @param includeInactive - Whether to include inactive groups (default: false)
   */
  async getByStoreId(
    storeId: string,
    includeInactive = false
  ): Promise<AddOnGroupRow[]> {
    let query = supabase
      .from('add_on_groups')
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
   * Get a single add-on group by ID
   */
  async getById(id: string): Promise<AddOnGroupRow | null> {
    const { data, error } = await supabase
      .from('add_on_groups')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get add-on groups applicable to a service (by serviceId and/or categoryId)
   * Filters by:
   * 1. applicable_to_all = true, OR
   * 2. serviceId is in applicable_service_ids, OR
   * 3. categoryId is in applicable_category_ids
   * @param storeId - The store ID
   * @param serviceId - Optional service ID to filter by
   * @param categoryId - Optional category ID to filter by
   */
  async getForService(
    storeId: string,
    serviceId?: string,
    categoryId?: string
  ): Promise<AddOnGroupRow[]> {
    // First get all active groups for the store
    const { data, error } = await supabase
      .from('add_on_groups')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    // Filter in JavaScript for complex array contains logic
    // PostgreSQL array operations via PostgREST are limited
    return data.filter((group) => {
      // If applicable to all services, include it
      if (group.applicable_to_all) {
        return true;
      }

      // Check if serviceId is in applicable_service_ids
      if (
        serviceId &&
        group.applicable_service_ids &&
        group.applicable_service_ids.includes(serviceId)
      ) {
        return true;
      }

      // Check if categoryId is in applicable_category_ids
      if (
        categoryId &&
        group.applicable_category_ids &&
        group.applicable_category_ids.includes(categoryId)
      ) {
        return true;
      }

      return false;
    });
  },

  /**
   * Get add-on groups visible for online booking
   */
  async getOnlineBookingGroups(storeId: string): Promise<AddOnGroupRow[]> {
    const { data, error } = await supabase
      .from('add_on_groups')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .eq('online_booking_enabled', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Search add-on groups by name
   */
  async search(
    storeId: string,
    query: string,
    limit = 50
  ): Promise<AddOnGroupRow[]> {
    const sanitizedQuery = sanitizeSearchQuery(query);
    if (!sanitizedQuery) return [];

    const { data, error } = await supabase
      .from('add_on_groups')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .ilike('name', `%${sanitizedQuery}%`)
      .order('display_order', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new add-on group
   */
  async create(group: AddOnGroupInsert): Promise<AddOnGroupRow> {
    const { data, error } = await supabase
      .from('add_on_groups')
      .insert(group)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing add-on group
   */
  async update(id: string, updates: AddOnGroupUpdate): Promise<AddOnGroupRow> {
    const { data, error } = await supabase
      .from('add_on_groups')
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
   * Soft delete an add-on group (tombstone pattern)
   * @param id - Group ID
   * @param userId - User performing the delete
   * @param deviceId - Device performing the delete
   */
  async delete(id: string, userId: string, deviceId: string): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30); // 30-day tombstone

    const { error } = await supabase
      .from('add_on_groups')
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
   * Hard delete an add-on group (permanent - use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('add_on_groups')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get add-on groups updated since a specific time (for sync)
   */
  async getUpdatedSince(
    storeId: string,
    since: Date
  ): Promise<AddOnGroupRow[]> {
    const { data, error } = await supabase
      .from('add_on_groups')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert add-on groups (for sync)
   */
  async upsertMany(groups: AddOnGroupInsert[]): Promise<AddOnGroupRow[]> {
    const { data, error } = await supabase
      .from('add_on_groups')
      .upsert(groups, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Update display order for multiple groups (batch reorder)
   */
  async updateDisplayOrder(
    updates: Array<{ id: string; displayOrder: number }>
  ): Promise<void> {
    // Supabase doesn't have batch update, so we do individual updates
    const promises = updates.map(({ id, displayOrder }) =>
      supabase
        .from('add_on_groups')
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
   * Activate an add-on group
   */
  async activate(id: string): Promise<AddOnGroupRow> {
    const { data, error } = await supabase
      .from('add_on_groups')
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
   * Deactivate an add-on group
   */
  async deactivate(id: string): Promise<AddOnGroupRow> {
    const { data, error } = await supabase
      .from('add_on_groups')
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
   * Get required add-on groups for a service
   * Returns groups where is_required = true
   */
  async getRequiredForService(
    storeId: string,
    serviceId?: string,
    categoryId?: string
  ): Promise<AddOnGroupRow[]> {
    const applicableGroups = await this.getForService(
      storeId,
      serviceId,
      categoryId
    );
    return applicableGroups.filter((group) => group.is_required);
  },
};
