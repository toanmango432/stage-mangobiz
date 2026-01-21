/**
 * Portfolio Items Table Operations
 * CRUD operations for the portfolio_items table in Supabase
 */

import { supabase } from '../client';
import type { PortfolioItemRow, PortfolioItemInsert, PortfolioItemUpdate } from '../types';

export const portfolioTable = {
  /**
   * Get all portfolio items for a staff member
   */
  async getByStaffId(staffId: string): Promise<PortfolioItemRow[]> {
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('staff_id', staffId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single portfolio item by ID
   */
  async getById(id: string): Promise<PortfolioItemRow | null> {
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get featured portfolio items for a store
   */
  async getFeaturedByStore(storeId: string): Promise<PortfolioItemRow[]> {
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get portfolio items by store
   */
  async getByStoreId(storeId: string): Promise<PortfolioItemRow[]> {
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new portfolio item
   */
  async create(item: PortfolioItemInsert): Promise<PortfolioItemRow> {
    const { data, error } = await supabase
      .from('portfolio_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing portfolio item
   */
  async update(id: string, updates: PortfolioItemUpdate): Promise<PortfolioItemRow> {
    const { data, error } = await supabase
      .from('portfolio_items')
      .update({ ...updates, sync_version: (updates.sync_version || 1) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a portfolio item (hard delete)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('portfolio_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Toggle featured status of a portfolio item
   */
  async toggleFeatured(id: string): Promise<PortfolioItemRow> {
    // First get the current state
    const current = await this.getById(id);
    if (!current) throw new Error('Portfolio item not found');

    // Toggle and update
    return this.update(id, {
      is_featured: !current.is_featured,
    });
  },

  /**
   * Increment likes for a portfolio item
   */
  async incrementLikes(id: string): Promise<PortfolioItemRow> {
    const current = await this.getById(id);
    if (!current) throw new Error('Portfolio item not found');

    return this.update(id, {
      likes: (current.likes || 0) + 1,
    });
  },

  /**
   * Get portfolio items updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<PortfolioItemRow[]> {
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert portfolio items (for sync)
   */
  async upsertMany(items: PortfolioItemInsert[]): Promise<PortfolioItemRow[]> {
    const { data, error } = await supabase
      .from('portfolio_items')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },
};
