import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../../services/supabase/client';
import type {
  LoyaltyProgram,
  LoyaltyTierConfig,
  LoyaltyRewardConfig,
} from '../../../types/client';

// ==================== LOYALTY PROGRAM ====================

/**
 * Fetch the loyalty program for the current store
 */
export const fetchLoyaltyProgram = createAsyncThunk(
  'loyalty/fetchProgram',
  async (storeId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (error) {
        // If no program exists, return null instead of throwing
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as LoyaltyProgram;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch loyalty program');
    }
  }
);

/**
 * Update the loyalty program configuration
 */
export const updateLoyaltyProgram = createAsyncThunk(
  'loyalty/updateProgram',
  async (
    { id, updates }: { id: string; updates: Partial<LoyaltyProgram> },
    { rejectWithValue }
  ) => {
    try {
      const { data, error } = await supabase
        .from('loyalty_programs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as LoyaltyProgram;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update loyalty program');
    }
  }
);

// ==================== LOYALTY TIERS ====================

/**
 * Fetch all loyalty tiers for a program
 */
export const fetchLoyaltyTiers = createAsyncThunk(
  'loyalty/fetchTiers',
  async (programId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('program_id', programId)
        .order('tier_order', { ascending: true });

      if (error) throw error;

      return data as LoyaltyTierConfig[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch loyalty tiers');
    }
  }
);

/**
 * Create a new loyalty tier
 */
export const createLoyaltyTier = createAsyncThunk(
  'loyalty/createTier',
  async (tier: Omit<LoyaltyTierConfig, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .insert(tier)
        .select()
        .single();

      if (error) throw error;

      return data as LoyaltyTierConfig;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create loyalty tier');
    }
  }
);

/**
 * Update a loyalty tier
 */
export const updateLoyaltyTier = createAsyncThunk(
  'loyalty/updateTier',
  async (
    { id, updates }: { id: string; updates: Partial<LoyaltyTierConfig> },
    { rejectWithValue }
  ) => {
    try {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as LoyaltyTierConfig;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update loyalty tier');
    }
  }
);

/**
 * Delete a loyalty tier
 */
export const deleteLoyaltyTier = createAsyncThunk(
  'loyalty/deleteTier',
  async (tierId: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('loyalty_tiers')
        .delete()
        .eq('id', tierId);

      if (error) throw error;

      return tierId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete loyalty tier');
    }
  }
);

// ==================== LOYALTY REWARDS ====================

/**
 * Fetch all loyalty rewards for a program
 */
export const fetchLoyaltyRewards = createAsyncThunk(
  'loyalty/fetchRewards',
  async (programId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('program_id', programId)
        .eq('is_active', true);

      if (error) throw error;

      return data as LoyaltyRewardConfig[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch loyalty rewards');
    }
  }
);

/**
 * Create a new loyalty reward
 */
export const createLoyaltyReward = createAsyncThunk(
  'loyalty/createReward',
  async (
    reward: Omit<LoyaltyRewardConfig, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>,
    { rejectWithValue }
  ) => {
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .insert(reward)
        .select()
        .single();

      if (error) throw error;

      return data as LoyaltyRewardConfig;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create loyalty reward');
    }
  }
);

/**
 * Update a loyalty reward
 */
export const updateLoyaltyReward = createAsyncThunk(
  'loyalty/updateReward',
  async (
    { id, updates }: { id: string; updates: Partial<LoyaltyRewardConfig> },
    { rejectWithValue }
  ) => {
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as LoyaltyRewardConfig;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update loyalty reward');
    }
  }
);

/**
 * Delete a loyalty reward (soft delete by setting is_active to false)
 */
export const deleteLoyaltyReward = createAsyncThunk(
  'loyalty/deleteReward',
  async (rewardId: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .update({ is_active: false })
        .eq('id', rewardId);

      if (error) throw error;

      return rewardId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete loyalty reward');
    }
  }
);
