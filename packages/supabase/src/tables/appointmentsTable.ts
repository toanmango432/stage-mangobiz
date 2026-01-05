/**
 * Appointments Table Operations
 * CRUD operations for the appointments table in Supabase
 */

import { supabase } from '../client';
import type { AppointmentRow, AppointmentInsert, AppointmentUpdate } from '../types';

export const appointmentsTable = {
  /**
   * Get all appointments for a store
   */
  async getByStoreId(storeId: string): Promise<AppointmentRow[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('store_id', storeId)
      .order('scheduled_start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get all appointments for a store on a specific date
   */
  async getByDate(storeId: string, date: Date): Promise<AppointmentRow[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('store_id', storeId)
      .gte('scheduled_start_time', startOfDay.toISOString())
      .lte('scheduled_start_time', endOfDay.toISOString())
      .order('scheduled_start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get appointments for a date range
   */
  async getByDateRange(storeId: string, startDate: Date, endDate: Date): Promise<AppointmentRow[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('store_id', storeId)
      .gte('scheduled_start_time', startDate.toISOString())
      .lte('scheduled_start_time', endDate.toISOString())
      .order('scheduled_start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get appointments by staff
   */
  async getByStaffId(storeId: string, staffId: string, date: Date): Promise<AppointmentRow[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('store_id', storeId)
      .eq('staff_id', staffId)
      .gte('scheduled_start_time', startOfDay.toISOString())
      .lte('scheduled_start_time', endOfDay.toISOString())
      .order('scheduled_start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get appointments by client
   */
  async getByClientId(storeId: string, clientId: string): Promise<AppointmentRow[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('store_id', storeId)
      .eq('client_id', clientId)
      .order('scheduled_start_time', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single appointment by ID
   */
  async getById(id: string): Promise<AppointmentRow | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create a new appointment
   */
  async create(appointment: AppointmentInsert): Promise<AppointmentRow> {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing appointment
   */
  async update(id: string, updates: AppointmentUpdate): Promise<AppointmentRow> {
    const { data, error } = await supabase
      .from('appointments')
      .update({ ...updates, sync_version: (updates.sync_version || 1) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update appointment status
   */
  async updateStatus(id: string, status: string): Promise<AppointmentRow> {
    return this.update(id, { status });
  },

  /**
   * Delete an appointment
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get appointments updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<AppointmentRow[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert appointments (for sync)
   */
  async upsertMany(appointments: AppointmentInsert[]): Promise<AppointmentRow[]> {
    const { data, error } = await supabase
      .from('appointments')
      .upsert(appointments, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Get upcoming appointments (today and future)
   */
  async getUpcoming(storeId: string, limit = 50): Promise<AppointmentRow[]> {
    const now = new Date();

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('store_id', storeId)
      .gte('scheduled_start_time', now.toISOString())
      .in('status', ['scheduled', 'confirmed'])
      .order('scheduled_start_time', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
