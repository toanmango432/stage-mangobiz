/**
 * Turn Logs Table Operations
 * CRUD operations for the turn_logs table in Supabase
 */

import { supabase } from '../client';
import type { TurnLogRow, TurnLogInsert, TurnLogUpdate, TurnType } from '../types';

export const turnLogsTable = {
  /**
   * Get all turn logs for a store on a specific date
   */
  async getByStoreAndDate(storeId: string, date: string): Promise<TurnLogRow[]> {
    const { data, error } = await supabase
      .from('turn_logs')
      .select('*')
      .eq('store_id', storeId)
      .eq('date', date)
      .eq('is_voided', false)
      .order('turn_timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get turn logs for a staff member on a specific date
   */
  async getByStaff(staffId: string, date: string): Promise<TurnLogRow[]> {
    const { data, error } = await supabase
      .from('turn_logs')
      .select('*')
      .eq('staff_id', staffId)
      .eq('date', date)
      .eq('is_voided', false)
      .order('turn_timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single turn log by ID
   */
  async getById(id: string): Promise<TurnLogRow | null> {
    const { data, error } = await supabase
      .from('turn_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get the next turn number for a store on a date
   */
  async getNextTurnNumber(storeId: string, date: string): Promise<number> {
    const { data, error } = await supabase
      .from('turn_logs')
      .select('turn_number')
      .eq('store_id', storeId)
      .eq('date', date)
      .order('turn_number', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0].turn_number + 1 : 1;
  },

  /**
   * Create a new turn log
   */
  async create(turnLog: TurnLogInsert): Promise<TurnLogRow> {
    const { data, error } = await supabase
      .from('turn_logs')
      .insert(turnLog)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Record a turn for a staff member
   */
  async recordTurn(
    storeId: string,
    staffId: string,
    turnType: TurnType,
    options?: {
      date?: string;
      turnValue?: number;
      ticketId?: string;
      appointmentId?: string;
      clientName?: string;
      services?: string[];
      serviceAmount?: number;
      adjustmentReason?: string;
      adjustedBy?: string;
      createdBy?: string;
      createdByDevice?: string;
    }
  ): Promise<TurnLogRow> {
    const date = options?.date || new Date().toISOString().split('T')[0];
    const turnNumber = await this.getNextTurnNumber(storeId, date);

    return this.create({
      store_id: storeId,
      staff_id: staffId,
      date,
      turn_number: turnNumber,
      turn_type: turnType,
      turn_value: options?.turnValue ?? 1.0,
      ticket_id: options?.ticketId || null,
      appointment_id: options?.appointmentId || null,
      client_name: options?.clientName || null,
      services: options?.services || null,
      service_amount: options?.serviceAmount ?? 0,
      adjustment_reason: options?.adjustmentReason || null,
      adjusted_by: options?.adjustedBy || null,
      created_by: options?.createdBy || null,
      created_by_device: options?.createdByDevice || null,
    });
  },

  /**
   * Void a turn log
   */
  async void(id: string, reason: string, voidedBy: string): Promise<TurnLogRow> {
    const { data, error } = await supabase
      .from('turn_logs')
      .update({
        is_voided: true,
        voided_at: new Date().toISOString(),
        voided_by: voidedBy,
        void_reason: reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get daily turn totals for all staff
   */
  async getDailyTotals(storeId: string, date: string): Promise<Array<{
    staff_id: string;
    total_turns: number;
    total_value: number;
    total_revenue: number;
  }>> {
    const { data, error } = await supabase
      .from('turn_logs')
      .select('staff_id, turn_value, service_amount')
      .eq('store_id', storeId)
      .eq('date', date)
      .eq('is_voided', false);

    if (error) throw error;

    // Aggregate by staff
    const totals = new Map<string, { total_turns: number; total_value: number; total_revenue: number }>();

    for (const log of data || []) {
      const existing = totals.get(log.staff_id) || { total_turns: 0, total_value: 0, total_revenue: 0 };
      existing.total_turns += 1;
      existing.total_value += log.turn_value || 0;
      existing.total_revenue += log.service_amount || 0;
      totals.set(log.staff_id, existing);
    }

    return Array.from(totals.entries()).map(([staff_id, stats]) => ({
      staff_id,
      ...stats,
    }));
  },

  /**
   * Get turn logs by ticket
   */
  async getByTicket(ticketId: string): Promise<TurnLogRow[]> {
    const { data, error } = await supabase
      .from('turn_logs')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('turn_timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get turn logs updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<TurnLogRow[]> {
    const { data, error } = await supabase
      .from('turn_logs')
      .select('*')
      .eq('store_id', storeId)
      .gt('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk insert turn logs (for sync)
   */
  async insertMany(turnLogs: TurnLogInsert[]): Promise<TurnLogRow[]> {
    const { data, error } = await supabase
      .from('turn_logs')
      .insert(turnLogs)
      .select();

    if (error) throw error;
    return data || [];
  },
};
