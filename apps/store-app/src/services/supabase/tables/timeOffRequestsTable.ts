/**
 * Time Off Requests Table Operations
 * CRUD operations for the time_off_requests table in Supabase
 */

import { supabase } from '../client';
import type { TimeOffRequestRow, TimeOffRequestInsert, TimeOffRequestUpdate, TimeOffStatus, Json } from '../types';

export const timeOffRequestsTable = {
  /**
   * Get all time off requests for a staff member
   */
  async getByStaff(staffId: string): Promise<TimeOffRequestRow[]> {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('staff_id', staffId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get pending time off requests for a store
   */
  async getPending(storeId: string): Promise<TimeOffRequestRow[]> {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get time off requests within a date range
   */
  async getByDateRange(
    storeId: string,
    startDate: string,
    endDate: string
  ): Promise<TimeOffRequestRow[]> {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('store_id', storeId)
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .in('status', ['pending', 'approved'])
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get approved time off for a specific date
   */
  async getApprovedForDate(storeId: string, date: string): Promise<TimeOffRequestRow[]> {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'approved')
      .lte('start_date', date)
      .gte('end_date', date);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single time off request by ID
   */
  async getById(id: string): Promise<TimeOffRequestRow | null> {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create a new time off request
   */
  async create(request: TimeOffRequestInsert): Promise<TimeOffRequestRow> {
    const { data, error } = await supabase
      .from('time_off_requests')
      .insert(request)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing time off request
   */
  async update(id: string, updates: TimeOffRequestUpdate): Promise<TimeOffRequestRow> {
    const { data, error } = await supabase
      .from('time_off_requests')
      .update({ ...updates, sync_version: (updates.sync_version || 1) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update request status (approve, deny)
   */
  async updateStatus(
    id: string,
    status: TimeOffStatus,
    reviewedBy: string,
    notes?: string
  ): Promise<TimeOffRequestRow> {
    return this.update(id, {
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_notes: notes || null,
    });
  },

  /**
   * Approve a time off request
   */
  async approve(id: string, reviewedBy: string, notes?: string): Promise<TimeOffRequestRow> {
    return this.updateStatus(id, 'approved', reviewedBy, notes);
  },

  /**
   * Deny a time off request
   */
  async deny(id: string, reviewedBy: string, notes?: string): Promise<TimeOffRequestRow> {
    return this.updateStatus(id, 'denied', reviewedBy, notes);
  },

  /**
   * Cancel a time off request
   */
  async cancel(id: string, cancelledBy: string, reason: string): Promise<TimeOffRequestRow> {
    return this.update(id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancellation_reason: reason,
    });
  },

  /**
   * Update conflict status
   */
  async updateConflicts(
    id: string,
    hasConflicts: boolean,
    conflictDetails?: Record<string, unknown>
  ): Promise<TimeOffRequestRow> {
    return this.update(id, {
      has_conflicts: hasConflicts,
      conflict_details: (conflictDetails ?? null) as Json | null,
    });
  },

  /**
   * Delete a time off request (only pending requests)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('time_off_requests')
      .delete()
      .eq('id', id)
      .eq('status', 'pending');

    if (error) throw error;
  },

  /**
   * Get time off requests updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<TimeOffRequestRow[]> {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert time off requests (for sync)
   */
  async upsertMany(requests: TimeOffRequestInsert[]): Promise<TimeOffRequestRow[]> {
    const { data, error } = await supabase
      .from('time_off_requests')
      .upsert(requests, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },
};
