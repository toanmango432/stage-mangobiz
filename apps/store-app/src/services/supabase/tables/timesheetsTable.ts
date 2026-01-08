/**
 * Timesheets Table Operations
 * CRUD operations for the timesheets table in Supabase
 */

import { supabase } from '../client';
import type { TimesheetRow, TimesheetInsert, TimesheetUpdate, TimesheetStatus } from '../types';

export const timesheetsTable = {
  /**
   * Get all timesheets for a store on a specific date
   */
  async getByStoreAndDate(storeId: string, date: string): Promise<TimesheetRow[]> {
    const { data, error } = await supabase
      .from('timesheets')
      .select('*')
      .eq('store_id', storeId)
      .eq('date', date)
      .order('actual_clock_in', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get timesheets for a staff member within a date range
   */
  async getByStaffAndDateRange(
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<TimesheetRow[]> {
    const { data, error } = await supabase
      .from('timesheets')
      .select('*')
      .eq('staff_id', staffId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get pending timesheets for approval
   */
  async getPending(storeId: string): Promise<TimesheetRow[]> {
    const { data, error } = await supabase
      .from('timesheets')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'pending')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single timesheet by ID
   */
  async getById(id: string): Promise<TimesheetRow | null> {
    const { data, error } = await supabase
      .from('timesheets')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get or create timesheet for a staff member on a specific date
   */
  async getOrCreate(storeId: string, staffId: string, date: string): Promise<TimesheetRow> {
    // Try to find existing
    const { data: existing, error: findError } = await supabase
      .from('timesheets')
      .select('*')
      .eq('store_id', storeId)
      .eq('staff_id', staffId)
      .eq('date', date)
      .single();

    if (findError && findError.code !== 'PGRST116') throw findError;
    if (existing) return existing;

    // Create new
    return this.create({ store_id: storeId, staff_id: staffId, date });
  },

  /**
   * Create a new timesheet
   */
  async create(timesheet: TimesheetInsert): Promise<TimesheetRow> {
    const { data, error } = await supabase
      .from('timesheets')
      .insert(timesheet)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing timesheet
   */
  async update(id: string, updates: TimesheetUpdate): Promise<TimesheetRow> {
    const { data, error } = await supabase
      .from('timesheets')
      .update({ ...updates, sync_version: (updates.sync_version || 1) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Clock in a staff member
   */
  async clockIn(
    storeId: string,
    staffId: string,
    date: string,
    clockInTime: string,
    location?: { lat: number; lng: number }
  ): Promise<TimesheetRow> {
    const timesheet = await this.getOrCreate(storeId, staffId, date);

    return this.update(timesheet.id, {
      actual_clock_in: clockInTime,
      clock_in_location: location ? { lat: location.lat, lng: location.lng } : null,
    });
  },

  /**
   * Clock out a staff member
   */
  async clockOut(
    id: string,
    clockOutTime: string,
    location?: { lat: number; lng: number }
  ): Promise<TimesheetRow> {
    return this.update(id, {
      actual_clock_out: clockOutTime,
      clock_out_location: location ? { lat: location.lat, lng: location.lng } : null,
    });
  },

  /**
   * Update timesheet status (approve, dispute)
   */
  async updateStatus(
    id: string,
    status: TimesheetStatus,
    approvedBy?: string
  ): Promise<TimesheetRow> {
    const updates: TimesheetUpdate = { status };

    if (status === 'approved' && approvedBy) {
      updates.approved_by = approvedBy;
      updates.approved_at = new Date().toISOString();
    }

    return this.update(id, updates);
  },

  /**
   * Add a break to a timesheet
   */
  async addBreak(
    id: string,
    breakData: { id: string; startTime: string; endTime?: string; type: 'paid' | 'unpaid'; duration: number }
  ): Promise<TimesheetRow> {
    // First get current breaks
    const current = await this.getById(id);
    if (!current) throw new Error('Timesheet not found');

    const currentBreaks = (current.breaks as unknown[]) || [];
    const newBreaks = [...currentBreaks, breakData];

    return this.update(id, {
      breaks: newBreaks as TimesheetUpdate['breaks'],
    });
  },

  /**
   * Mark timesheet as disputed
   */
  async dispute(id: string, reason: string): Promise<TimesheetRow> {
    return this.update(id, {
      status: 'disputed',
      dispute_reason: reason,
    });
  },

  /**
   * Get timesheets updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<TimesheetRow[]> {
    const { data, error } = await supabase
      .from('timesheets')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert timesheets (for sync)
   */
  async upsertMany(timesheets: TimesheetInsert[]): Promise<TimesheetRow[]> {
    const { data, error } = await supabase
      .from('timesheets')
      .upsert(timesheets, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },
};
