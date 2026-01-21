/**
 * Pay Runs Table Operations
 * CRUD operations for the pay_runs table in Supabase
 */

import { supabase } from '../client';
import type { PayRunRow, PayRunInsert, PayRunUpdate, PayRunStatus, Json } from '../types';

export const payRunsTable = {
  /**
   * Get all pay runs for a store
   */
  async getAll(storeId: string): Promise<PayRunRow[]> {
    const { data, error } = await supabase
      .from('pay_runs')
      .select('*')
      .eq('store_id', storeId)
      .order('period_end', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get pay runs by date range
   */
  async getByDateRange(
    storeId: string,
    startDate: string,
    endDate: string
  ): Promise<PayRunRow[]> {
    const { data, error } = await supabase
      .from('pay_runs')
      .select('*')
      .eq('store_id', storeId)
      .gte('period_start', startDate)
      .lte('period_end', endDate)
      .order('period_start', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get pay runs by status
   */
  async getByStatus(storeId: string, status: PayRunStatus): Promise<PayRunRow[]> {
    const { data, error } = await supabase
      .from('pay_runs')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', status)
      .order('period_end', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single pay run by ID
   */
  async getById(id: string): Promise<PayRunRow | null> {
    const { data, error } = await supabase
      .from('pay_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create a new pay run
   */
  async create(payRun: PayRunInsert): Promise<PayRunRow> {
    const { data, error } = await supabase
      .from('pay_runs')
      .insert(payRun)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing pay run
   */
  async update(id: string, updates: PayRunUpdate): Promise<PayRunRow> {
    const { data, error } = await supabase
      .from('pay_runs')
      .update({ ...updates, sync_version: (updates.sync_version || 1) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Submit pay run for approval
   */
  async submit(id: string, submittedBy: string): Promise<PayRunRow> {
    return this.update(id, {
      status: 'pending_approval',
      submitted_by: submittedBy,
      submitted_at: new Date().toISOString(),
    });
  },

  /**
   * Approve a pay run
   */
  async approve(id: string, approvedBy: string, notes?: string): Promise<PayRunRow> {
    return this.update(id, {
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      approval_notes: notes || null,
    });
  },

  /**
   * Reject a pay run (returns to draft for editing)
   */
  async reject(id: string, rejectedBy: string, reason: string): Promise<PayRunRow> {
    return this.update(id, {
      status: 'draft',
      rejected_by: rejectedBy,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
      // Clear submission fields so it returns to draft state
      submitted_by: null,
      submitted_at: null,
    });
  },

  /**
   * Mark pay run as processed
   */
  async process(id: string, processedBy: string, notes?: string): Promise<PayRunRow> {
    return this.update(id, {
      status: 'processed',
      processed_by: processedBy,
      processed_at: new Date().toISOString(),
      processing_notes: notes || null,
    });
  },

  /**
   * Void a pay run
   */
  async void(id: string, voidedBy: string, reason: string): Promise<PayRunRow> {
    return this.update(id, {
      status: 'voided',
      voided_by: voidedBy,
      voided_at: new Date().toISOString(),
      void_reason: reason,
    });
  },

  /**
   * Update staff payments in a pay run
   */
  async updatePayments(id: string, staffPayments: unknown[], totals: unknown): Promise<PayRunRow> {
    return this.update(id, {
      staff_payments: staffPayments as PayRunUpdate['staff_payments'],
      totals: totals as PayRunUpdate['totals'],
    });
  },

  /**
   * Get pay runs updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<PayRunRow[]> {
    const { data, error } = await supabase
      .from('pay_runs')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert pay runs (for sync)
   */
  async upsertMany(payRuns: PayRunInsert[]): Promise<PayRunRow[]> {
    const { data, error } = await supabase
      .from('pay_runs')
      .upsert(payRuns, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },
};
