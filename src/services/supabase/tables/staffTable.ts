/**
 * Staff Table Operations
 * CRUD operations for the staff table in Supabase
 */

import { supabase } from '../client';
import type { StaffRow, StaffInsert, StaffUpdate } from '../types';

export const staffTable = {
  /**
   * Get all staff for a store
   */
  async getByStoreId(storeId: string): Promise<StaffRow[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('store_id', storeId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get active staff only
   */
  async getActiveByStoreId(storeId: string): Promise<StaffRow[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single staff by ID
   */
  async getById(id: string): Promise<StaffRow | null> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get available staff (status = 'available')
   */
  async getAvailable(storeId: string): Promise<StaffRow[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .eq('status', 'available')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new staff member
   */
  async create(staff: StaffInsert): Promise<StaffRow> {
    const { data, error } = await supabase
      .from('staff')
      .insert(staff)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing staff member
   */
  async update(id: string, updates: StaffUpdate): Promise<StaffRow> {
    const { data, error } = await supabase
      .from('staff')
      .update({ ...updates, sync_version: (updates.sync_version || 1) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update staff status
   */
  async updateStatus(id: string, status: string): Promise<StaffRow> {
    return this.update(id, { status });
  },

  /**
   * Delete a staff member
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get staff updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<StaffRow[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert staff (for sync)
   */
  async upsertMany(staffList: StaffInsert[]): Promise<StaffRow[]> {
    const { data, error } = await supabase
      .from('staff')
      .upsert(staffList, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },
};
