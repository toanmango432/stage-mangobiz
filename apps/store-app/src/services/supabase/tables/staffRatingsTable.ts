/**
 * Staff Ratings Table Operations
 * CRUD operations for the staff_ratings table in Supabase
 */

import { supabase } from '../client';
import type { StaffRatingRow, StaffRatingInsert, StaffRatingUpdate, RatingStatus } from '../types';

export const staffRatingsTable = {
  /**
   * Get all ratings for a staff member
   */
  async getByStaff(
    staffId: string,
    options?: { includeHidden?: boolean; limit?: number }
  ): Promise<StaffRatingRow[]> {
    let query = supabase
      .from('staff_ratings')
      .select('*')
      .eq('staff_id', staffId)
      .order('created_at', { ascending: false });

    if (!options?.includeHidden) {
      query = query.eq('status', 'active');
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Get public ratings for a staff member (for online booking display)
   */
  async getPublicByStaff(staffId: string, limit: number = 10): Promise<StaffRatingRow[]> {
    const { data, error } = await supabase
      .from('staff_ratings')
      .select('*')
      .eq('staff_id', staffId)
      .eq('status', 'active')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get ratings for a store (all staff)
   */
  async getByStore(storeId: string, options?: { status?: RatingStatus; limit?: number }): Promise<StaffRatingRow[]> {
    let query = supabase
      .from('staff_ratings')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Get flagged ratings for moderation
   */
  async getFlagged(storeId: string): Promise<StaffRatingRow[]> {
    const { data, error } = await supabase
      .from('staff_ratings')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'flagged')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single rating by ID
   */
  async getById(id: string): Promise<StaffRatingRow | null> {
    const { data, error } = await supabase
      .from('staff_ratings')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create a new rating
   */
  async create(rating: StaffRatingInsert): Promise<StaffRatingRow> {
    const { data, error } = await supabase
      .from('staff_ratings')
      .insert(rating)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing rating
   */
  async update(id: string, updates: StaffRatingUpdate): Promise<StaffRatingRow> {
    const { data, error } = await supabase
      .from('staff_ratings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update rating status (hide, flag, remove)
   */
  async updateStatus(
    id: string,
    status: RatingStatus,
    moderatedBy?: string,
    notes?: string
  ): Promise<StaffRatingRow> {
    const updates: StaffRatingUpdate = { status };

    if (moderatedBy) {
      updates.moderated_by = moderatedBy;
      updates.moderated_at = new Date().toISOString();
      updates.moderation_notes = notes || null;
    }

    return this.update(id, updates);
  },

  /**
   * Flag a rating for review
   */
  async flag(id: string, reason: string, flaggedBy: string): Promise<StaffRatingRow> {
    return this.update(id, {
      status: 'flagged',
      flagged_reason: reason,
      moderated_by: flaggedBy,
      moderated_at: new Date().toISOString(),
    });
  },

  /**
   * Add a response from staff/business to a rating
   */
  async addResponse(
    id: string,
    responseText: string,
    responseBy: string
  ): Promise<StaffRatingRow> {
    return this.update(id, {
      response_text: responseText,
      response_by: responseBy,
      response_at: new Date().toISOString(),
    });
  },

  /**
   * Get aggregate stats for a staff member
   */
  async getAggregates(staffId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }> {
    const { data, error } = await supabase
      .from('staff_ratings')
      .select('rating')
      .eq('staff_id', staffId)
      .eq('status', 'active')
      .eq('is_public', true);

    if (error) throw error;

    const ratings = data || [];
    const totalReviews = ratings.length;
    const averageRating = totalReviews > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of ratings) {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    }

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
    };
  },

  /**
   * Delete a rating
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff_ratings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get ratings updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<StaffRatingRow[]> {
    const { data, error } = await supabase
      .from('staff_ratings')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert ratings (for sync)
   */
  async upsertMany(ratings: StaffRatingInsert[]): Promise<StaffRatingRow[]> {
    const { data, error } = await supabase
      .from('staff_ratings')
      .upsert(ratings, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },
};
