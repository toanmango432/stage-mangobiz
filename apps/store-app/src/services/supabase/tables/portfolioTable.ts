/**
 * Portfolio Table Operations
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
   * Get featured portfolio items for a staff member
   */
  async getFeaturedByStaffId(staffId: string): Promise<PortfolioItemRow[]> {
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('staff_id', staffId)
      .eq('is_featured', true)
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
   * Delete a portfolio item (soft delete via sync_status)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('portfolio_items')
      .update({ sync_status: 'deleted' })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Toggle featured status of a portfolio item
   */
  async toggleFeatured(id: string): Promise<PortfolioItemRow> {
    // First get current state
    const current = await this.getById(id);
    if (!current) throw new Error('Portfolio item not found');

    // Toggle the featured status
    const { data, error } = await supabase
      .from('portfolio_items')
      .update({ is_featured: !current.is_featured })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Increment likes count
   */
  async incrementLikes(id: string): Promise<PortfolioItemRow> {
    const current = await this.getById(id);
    if (!current) throw new Error('Portfolio item not found');

    const { data, error } = await supabase
      .from('portfolio_items')
      .update({ likes: (current.likes || 0) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get portfolio items by tag
   */
  async getByTag(staffId: string, tag: string): Promise<PortfolioItemRow[]> {
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('staff_id', staffId)
      .contains('tags', [tag])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get portfolio items updated since a specific time (for sync)
   */
  async getUpdatedSince(staffId: string, since: Date): Promise<PortfolioItemRow[]> {
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('staff_id', staffId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
