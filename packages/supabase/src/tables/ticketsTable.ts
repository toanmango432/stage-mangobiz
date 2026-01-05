/**
 * Tickets Table Operations
 * CRUD operations for the tickets table in Supabase
 */

import { supabase } from '../client';
import type { TicketRow, TicketInsert, TicketUpdate } from '../types';

export const ticketsTable = {
  /**
   * Get all tickets for a store on a specific date
   */
  async getByDate(storeId: string, date: Date): Promise<TicketRow[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('store_id', storeId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get open tickets
   */
  async getOpenTickets(storeId: string): Promise<TicketRow[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('store_id', storeId)
      .in('status', ['open', 'in-progress'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get tickets by status
   */
  async getByStatus(storeId: string, status: string): Promise<TicketRow[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get tickets by client
   */
  async getByClientId(storeId: string, clientId: string): Promise<TicketRow[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('store_id', storeId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single ticket by ID
   */
  async getById(id: string): Promise<TicketRow | null> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get ticket by appointment ID
   */
  async getByAppointmentId(appointmentId: string): Promise<TicketRow | null> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create a new ticket
   */
  async create(ticket: TicketInsert): Promise<TicketRow> {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticket)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing ticket
   */
  async update(id: string, updates: TicketUpdate): Promise<TicketRow> {
    const { data, error } = await supabase
      .from('tickets')
      .update({ ...updates, sync_version: (updates.sync_version || 1) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update ticket status
   */
  async updateStatus(id: string, status: string): Promise<TicketRow> {
    return this.update(id, { status });
  },

  /**
   * Complete a ticket
   */
  async complete(id: string, payments: unknown[]): Promise<TicketRow> {
    return this.update(id, {
      status: 'completed',
      payments: payments as TicketUpdate['payments'],
    });
  },

  /**
   * Delete a ticket
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get tickets updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<TicketRow[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert tickets (for sync)
   */
  async upsertMany(tickets: TicketInsert[]): Promise<TicketRow[]> {
    const { data, error } = await supabase
      .from('tickets')
      .upsert(tickets, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Get daily sales summary
   */
  async getDailySummary(storeId: string, date: Date): Promise<{
    totalTickets: number;
    totalRevenue: number;
    totalTips: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('tickets')
      .select('total, tip')
      .eq('store_id', storeId)
      .eq('status', 'completed')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (error) throw error;

    const tickets = data || [];
    return {
      totalTickets: tickets.length,
      totalRevenue: tickets.reduce((sum, t) => sum + (t.total || 0), 0),
      totalTips: tickets.reduce((sum, t) => sum + (t.tip || 0), 0),
    };
  },
};
