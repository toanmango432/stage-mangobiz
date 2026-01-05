/**
 * Clients Table Operations
 * CRUD operations for the clients table in Supabase
 */

import { supabase } from '../client';
import type { ClientRow, ClientInsert, ClientUpdate } from '../types';

export const clientsTable = {
  /**
   * Get all clients for a store
   */
  async getByStoreId(storeId: string): Promise<ClientRow[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('store_id', storeId)
      .order('last_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single client by ID
   */
  async getById(id: string): Promise<ClientRow | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Search clients by name or phone
   */
  async search(storeId: string, query: string): Promise<ClientRow[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('store_id', storeId)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('last_name', { ascending: true })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new client
   */
  async create(client: ClientInsert): Promise<ClientRow> {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing client
   */
  async update(id: string, updates: ClientUpdate): Promise<ClientRow> {
    const { data, error } = await supabase
      .from('clients')
      .update({ ...updates, sync_version: (updates.sync_version || 1) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a client
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get clients updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<ClientRow[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert clients (for sync)
   */
  async upsertMany(clients: ClientInsert[]): Promise<ClientRow[]> {
    const { data, error } = await supabase
      .from('clients')
      .upsert(clients, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Get VIP clients
   */
  async getVipClients(storeId: string): Promise<ClientRow[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_vip', true)
      .order('last_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get blocked clients
   */
  async getBlockedClients(storeId: string): Promise<ClientRow[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_blocked', true)
      .order('last_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
