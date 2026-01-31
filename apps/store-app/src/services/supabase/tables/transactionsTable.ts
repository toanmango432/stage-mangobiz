/**
 * Transactions Table Operations
 * CRUD operations for the transactions table in Supabase
 */

import { supabase } from '../client';
import type { TransactionRow, TransactionInsert, TransactionUpdate } from '../types';

export const transactionsTable = {
  /**
   * Get all transactions for a store on a specific date
   */
  async getByDate(storeId: string, date: Date): Promise<TransactionRow[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('store_id', storeId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get transactions by ticket
   */
  async getByTicketId(ticketId: string): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get transactions by client
   */
  async getByClientId(storeId: string, clientId: string): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('store_id', storeId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get transactions by type
   */
  async getByType(storeId: string, type: string, date?: Date): Promise<TransactionRow[]> {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('store_id', storeId)
      .eq('type', type);

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single transaction by ID
   */
  async getById(id: string): Promise<TransactionRow | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create a new transaction
   */
  async create(transaction: TransactionInsert): Promise<TransactionRow> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing transaction
   */
  async update(id: string, updates: TransactionUpdate): Promise<TransactionRow> {
    const { data, error } = await supabase
      .from('transactions')
      .update({ ...updates, sync_version: (updates.sync_version || 1) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a transaction
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get transactions updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert transactions (for sync)
   */
  async upsertMany(transactions: TransactionInsert[]): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .upsert(transactions, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Get payment method breakdown for a date
   */
  async getPaymentBreakdown(storeId: string, date: Date): Promise<Record<string, number>> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('transactions')
      .select('payment_method, total')
      .eq('store_id', storeId)
      .eq('type', 'sale')
      .eq('status', 'completed')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (error) throw error;

    const breakdown: Record<string, number> = {};
    (data || []).forEach(t => {
      const method = t.payment_method || 'unknown';
      breakdown[method] = (breakdown[method] || 0) + (t.total || 0);
    });

    return breakdown;
  },

  /**
   * Get completed transactions for a staff member within a date range.
   * Note: Staff is tracked via tickets' services JSON field, so this method
   * retrieves all completed transactions for the period, and the caller
   * should join with tickets to filter by staff.
   */
  async getByDateRangeAndStatus(
    storeId: string,
    startDate: Date,
    endDate: Date,
    status = 'completed'
  ): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', status)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get daily totals summary
   */
  async getDailySummary(storeId: string, date: Date): Promise<{
    totalSales: number;
    totalRefunds: number;
    totalTips: number;
    netRevenue: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('transactions')
      .select('type, total, tip')
      .eq('store_id', storeId)
      .eq('status', 'completed')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (error) throw error;

    const transactions = data || [];
    const sales = transactions.filter(t => t.type === 'sale');
    const refunds = transactions.filter(t => t.type === 'refund');

    const totalSales = sales.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalRefunds = refunds.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalTips = transactions.reduce((sum, t) => sum + (t.tip || 0), 0);

    return {
      totalSales,
      totalRefunds,
      totalTips,
      netRevenue: totalSales - totalRefunds,
    };
  },
};
