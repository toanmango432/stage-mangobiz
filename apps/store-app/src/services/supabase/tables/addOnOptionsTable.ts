/**
 * Add-On Options Table Operations
 * CRUD operations for the add_on_options table in Supabase
 */

import { supabase } from '../client';
import type {
  AddOnOptionRow,
  AddOnOptionInsert,
  AddOnOptionUpdate,
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

export const addOnOptionsTable = {
  /**
   * Get all add-on options for a store
   * @param storeId - The store ID
   * @param includeInactive - Whether to include inactive options (default: false)
   */
  async getByStoreId(
    storeId: string,
    includeInactive = false
  ): Promise<AddOnOptionRow[]> {
    let query = supabase
      .from('add_on_options')
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
   * Get a single add-on option by ID
   */
  async getById(id: string): Promise<AddOnOptionRow | null> {
    const { data, error } = await supabase
      .from('add_on_options')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get all options for a specific add-on group
   * @param groupId - The add-on group ID
   * @param includeInactive - Whether to include inactive options (default: false)
   */
  async getByGroupId(
    groupId: string,
    includeInactive = false
  ): Promise<AddOnOptionRow[]> {
    let query = supabase
      .from('add_on_options')
      .select('*')
      .eq('group_id', groupId)
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
   * Get all options for multiple groups (for bulk loading)
   * @param groupIds - Array of add-on group IDs
   */
  async getByGroupIds(groupIds: string[]): Promise<AddOnOptionRow[]> {
    if (groupIds.length === 0) return [];

    const { data, error } = await supabase
      .from('add_on_options')
      .select('*')
      .in('group_id', groupIds)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .order('group_id')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Search add-on options by name
   */
  async search(
    storeId: string,
    query: string,
    limit = 50
  ): Promise<AddOnOptionRow[]> {
    const sanitizedQuery = sanitizeSearchQuery(query);
    if (!sanitizedQuery) return [];

    const { data, error } = await supabase
      .from('add_on_options')
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
   * Create a new add-on option
   */
  async create(option: AddOnOptionInsert): Promise<AddOnOptionRow> {
    const { data, error } = await supabase
      .from('add_on_options')
      .insert(option)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing add-on option
   */
  async update(
    id: string,
    updates: AddOnOptionUpdate
  ): Promise<AddOnOptionRow> {
    const { data, error } = await supabase
      .from('add_on_options')
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
   * Soft delete an add-on option (tombstone pattern)
   * @param id - Option ID
   * @param userId - User performing the delete
   * @param deviceId - Device performing the delete
   */
  async delete(id: string, userId: string, deviceId: string): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30); // 30-day tombstone

    const { error } = await supabase
      .from('add_on_options')
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
   * Soft delete all options for a group (cascade-like behavior)
   * @param groupId - The add-on group ID
   * @param userId - User performing the delete
   * @param deviceId - Device performing the delete
   */
  async deleteByGroupId(
    groupId: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30);

    const { error } = await supabase
      .from('add_on_options')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deleted_by_device: deviceId,
        tombstone_expires_at: tombstoneExpiresAt.toISOString(),
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('group_id', groupId)
      .eq('is_deleted', false);

    if (error) throw error;
  },

  /**
   * Hard delete an add-on option (permanent - use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('add_on_options')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get add-on options updated since a specific time (for sync)
   */
  async getUpdatedSince(
    storeId: string,
    since: Date
  ): Promise<AddOnOptionRow[]> {
    const { data, error } = await supabase
      .from('add_on_options')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert add-on options (for sync)
   */
  async upsertMany(options: AddOnOptionInsert[]): Promise<AddOnOptionRow[]> {
    const { data, error } = await supabase
      .from('add_on_options')
      .upsert(options, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Update display order for multiple options (batch reorder)
   */
  async updateDisplayOrder(
    updates: Array<{ id: string; displayOrder: number }>
  ): Promise<void> {
    // Supabase doesn't have batch update, so we do individual updates
    const promises = updates.map(({ id, displayOrder }) =>
      supabase
        .from('add_on_options')
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
   * Activate an add-on option
   */
  async activate(id: string): Promise<AddOnOptionRow> {
    const { data, error } = await supabase
      .from('add_on_options')
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
   * Deactivate an add-on option
   */
  async deactivate(id: string): Promise<AddOnOptionRow> {
    const { data, error } = await supabase
      .from('add_on_options')
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
   * Count active options in a group
   */
  async countByGroupId(groupId: string): Promise<number> {
    const { count, error } = await supabase
      .from('add_on_options')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('is_deleted', false)
      .eq('is_active', true);

    if (error) throw error;
    return count || 0;
  },
};
