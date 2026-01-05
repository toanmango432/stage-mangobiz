/**
 * Services Table Operations
 * CRUD operations for the services table in Supabase
 */

import { supabase } from '../client';
import type { ServiceRow, ServiceInsert, ServiceUpdate } from '../types';

export const servicesTable = {
  /**
   * Get all services for a store
   */
  async getByStoreId(storeId: string): Promise<ServiceRow[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('store_id', storeId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get active services only
   */
  async getActiveByStoreId(storeId: string): Promise<ServiceRow[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single service by ID
   */
  async getById(id: string): Promise<ServiceRow | null> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get services by category
   */
  async getByCategory(storeId: string, category: string): Promise<ServiceRow[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('store_id', storeId)
      .eq('category', category)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get distinct categories
   */
  async getCategories(storeId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('services')
      .select('category')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) throw error;

    // Extract unique categories
    const categories = [...new Set(data?.map(s => s.category).filter(Boolean) as string[])];
    return categories;
  },

  /**
   * Create a new service
   */
  async create(service: ServiceInsert): Promise<ServiceRow> {
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing service
   */
  async update(id: string, updates: ServiceUpdate): Promise<ServiceRow> {
    const { data, error } = await supabase
      .from('services')
      .update({ ...updates, sync_version: (updates.sync_version || 1) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a service
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get services updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<ServiceRow[]> {
    const { data, error } = await supabase
      .from('services')
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
  async upsertMany(services: ServiceInsert[]): Promise<ServiceRow[]> {
    const { data, error } = await supabase
      .from('services')
      .upsert(services, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },
};
