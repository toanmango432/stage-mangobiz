/**
 * Service Categories Table Operations
 * CRUD operations for the service_categories table in Supabase
 */

import { supabase } from '../client';
import type {
  ServiceCategoryRow,
  ServiceCategoryInsert,
  ServiceCategoryUpdate,
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

export const serviceCategoriesTable = {
  /**
   * Get all categories for a store
   * @param storeId - The store ID
   * @param includeInactive - Whether to include inactive categories (default: false)
   */
  async getByStoreId(
    storeId: string,
    includeInactive = false
  ): Promise<ServiceCategoryRow[]> {
    let query = supabase
      .from('service_categories')
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
   * Get a single category by ID
   */
  async getById(id: string): Promise<ServiceCategoryRow | null> {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get child categories of a parent category
   */
  async getByParentId(
    parentCategoryId: string
  ): Promise<ServiceCategoryRow[]> {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('parent_category_id', parentCategoryId)
      .eq('is_deleted', false)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get root categories (categories without a parent)
   */
  async getRootCategories(storeId: string): Promise<ServiceCategoryRow[]> {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('store_id', storeId)
      .is('parent_category_id', null)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Search categories by name
   */
  async search(storeId: string, query: string): Promise<ServiceCategoryRow[]> {
    const sanitizedQuery = sanitizeSearchQuery(query);
    if (!sanitizedQuery) return [];

    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .ilike('name', `%${sanitizedQuery}%`)
      .order('display_order', { ascending: true })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new category
   */
  async create(category: ServiceCategoryInsert): Promise<ServiceCategoryRow> {
    const { data, error } = await supabase
      .from('service_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing category
   */
  async update(
    id: string,
    updates: ServiceCategoryUpdate
  ): Promise<ServiceCategoryRow> {
    const { data, error } = await supabase
      .from('service_categories')
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
   * Soft delete a category (tombstone pattern)
   * @param id - Category ID
   * @param userId - User performing the delete
   * @param deviceId - Device performing the delete
   */
  async delete(
    id: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30); // 30-day tombstone

    const { error } = await supabase
      .from('service_categories')
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
   * Hard delete a category (permanent - use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get categories updated since a specific time (for sync)
   */
  async getUpdatedSince(
    storeId: string,
    since: Date
  ): Promise<ServiceCategoryRow[]> {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert categories (for sync)
   */
  async upsertMany(
    categories: ServiceCategoryInsert[]
  ): Promise<ServiceCategoryRow[]> {
    const { data, error } = await supabase
      .from('service_categories')
      .upsert(categories, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Update display order for multiple categories (batch reorder)
   */
  async updateDisplayOrder(
    updates: Array<{ id: string; displayOrder: number }>
  ): Promise<void> {
    // Supabase doesn't have batch update, so we do individual updates
    const promises = updates.map(({ id, displayOrder }) =>
      supabase
        .from('service_categories')
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
   * Get categories visible for online booking
   */
  async getOnlineBookingCategories(
    storeId: string
  ): Promise<ServiceCategoryRow[]> {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .eq('show_online_booking', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
