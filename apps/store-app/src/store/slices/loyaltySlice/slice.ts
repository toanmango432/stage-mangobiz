import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../index';
import type {
  LoyaltyProgram,
  LoyaltyTierConfig,
  LoyaltyRewardConfig,
} from '../../../types/client';
import {
  fetchLoyaltyProgram,
  updateLoyaltyProgram,
  fetchLoyaltyTiers,
  createLoyaltyTier,
  updateLoyaltyTier,
  deleteLoyaltyTier,
  fetchLoyaltyRewards,
  createLoyaltyReward,
  updateLoyaltyReward,
  deleteLoyaltyReward,
} from './thunks';

export interface LoyaltyState {
  // Program configuration
  program: LoyaltyProgram | null;
  programLoading: boolean;
  programError: string | null;

  // Tiers
  tiers: LoyaltyTierConfig[];
  tiersLoading: boolean;
  tiersError: string | null;

  // Rewards
  rewards: LoyaltyRewardConfig[];
  rewardsLoading: boolean;
  rewardsError: string | null;
}

const initialState: LoyaltyState = {
  program: null,
  programLoading: false,
  programError: null,

  tiers: [],
  tiersLoading: false,
  tiersError: null,

  rewards: [],
  rewardsLoading: false,
  rewardsError: null,
};

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.programError = null;
      state.tiersError = null;
      state.rewardsError = null;
    },
    updateTierOrder: (state, action: PayloadAction<{ tierId: string; newOrder: number }>) => {
      const tier = state.tiers.find(t => t.id === action.payload.tierId);
      if (tier) {
        tier.tierOrder = action.payload.newOrder;
      }
    },
  },
  extraReducers: (builder) => {
    // ==================== PROGRAM ====================
    builder
      .addCase(fetchLoyaltyProgram.pending, (state) => {
        state.programLoading = true;
        state.programError = null;
      })
      .addCase(fetchLoyaltyProgram.fulfilled, (state, action) => {
        state.programLoading = false;
        state.program = action.payload;
      })
      .addCase(fetchLoyaltyProgram.rejected, (state, action) => {
        state.programLoading = false;
        state.programError = action.payload as string;
      });

    builder
      .addCase(updateLoyaltyProgram.pending, (state) => {
        state.programLoading = true;
        state.programError = null;
      })
      .addCase(updateLoyaltyProgram.fulfilled, (state, action) => {
        state.programLoading = false;
        state.program = action.payload;
      })
      .addCase(updateLoyaltyProgram.rejected, (state, action) => {
        state.programLoading = false;
        state.programError = action.payload as string;
      });

    // ==================== TIERS ====================
    builder
      .addCase(fetchLoyaltyTiers.pending, (state) => {
        state.tiersLoading = true;
        state.tiersError = null;
      })
      .addCase(fetchLoyaltyTiers.fulfilled, (state, action) => {
        state.tiersLoading = false;
        state.tiers = action.payload;
      })
      .addCase(fetchLoyaltyTiers.rejected, (state, action) => {
        state.tiersLoading = false;
        state.tiersError = action.payload as string;
      });

    builder
      .addCase(createLoyaltyTier.pending, (state) => {
        state.tiersLoading = true;
        state.tiersError = null;
      })
      .addCase(createLoyaltyTier.fulfilled, (state, action) => {
        state.tiersLoading = false;
        state.tiers.push(action.payload);
      })
      .addCase(createLoyaltyTier.rejected, (state, action) => {
        state.tiersLoading = false;
        state.tiersError = action.payload as string;
      });

    builder
      .addCase(updateLoyaltyTier.pending, (state) => {
        state.tiersLoading = true;
        state.tiersError = null;
      })
      .addCase(updateLoyaltyTier.fulfilled, (state, action) => {
        state.tiersLoading = false;
        const index = state.tiers.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tiers[index] = action.payload;
        }
      })
      .addCase(updateLoyaltyTier.rejected, (state, action) => {
        state.tiersLoading = false;
        state.tiersError = action.payload as string;
      });

    builder
      .addCase(deleteLoyaltyTier.pending, (state) => {
        state.tiersLoading = true;
        state.tiersError = null;
      })
      .addCase(deleteLoyaltyTier.fulfilled, (state, action) => {
        state.tiersLoading = false;
        state.tiers = state.tiers.filter(t => t.id !== action.payload);
      })
      .addCase(deleteLoyaltyTier.rejected, (state, action) => {
        state.tiersLoading = false;
        state.tiersError = action.payload as string;
      });

    // ==================== REWARDS ====================
    builder
      .addCase(fetchLoyaltyRewards.pending, (state) => {
        state.rewardsLoading = true;
        state.rewardsError = null;
      })
      .addCase(fetchLoyaltyRewards.fulfilled, (state, action) => {
        state.rewardsLoading = false;
        state.rewards = action.payload;
      })
      .addCase(fetchLoyaltyRewards.rejected, (state, action) => {
        state.rewardsLoading = false;
        state.rewardsError = action.payload as string;
      });

    builder
      .addCase(createLoyaltyReward.pending, (state) => {
        state.rewardsLoading = true;
        state.rewardsError = null;
      })
      .addCase(createLoyaltyReward.fulfilled, (state, action) => {
        state.rewardsLoading = false;
        state.rewards.push(action.payload);
      })
      .addCase(createLoyaltyReward.rejected, (state, action) => {
        state.rewardsLoading = false;
        state.rewardsError = action.payload as string;
      });

    builder
      .addCase(updateLoyaltyReward.pending, (state) => {
        state.rewardsLoading = true;
        state.rewardsError = null;
      })
      .addCase(updateLoyaltyReward.fulfilled, (state, action) => {
        state.rewardsLoading = false;
        const index = state.rewards.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.rewards[index] = action.payload;
        }
      })
      .addCase(updateLoyaltyReward.rejected, (state, action) => {
        state.rewardsLoading = false;
        state.rewardsError = action.payload as string;
      });

    builder
      .addCase(deleteLoyaltyReward.pending, (state) => {
        state.rewardsLoading = true;
        state.rewardsError = null;
      })
      .addCase(deleteLoyaltyReward.fulfilled, (state, action) => {
        state.rewardsLoading = false;
        state.rewards = state.rewards.filter(r => r.id !== action.payload);
      })
      .addCase(deleteLoyaltyReward.rejected, (state, action) => {
        state.rewardsLoading = false;
        state.rewardsError = action.payload as string;
      });
  },
});

// ==================== ACTIONS ====================
export const { clearErrors, updateTierOrder } = loyaltySlice.actions;

// ==================== SELECTORS ====================
export const selectLoyaltyProgram = (state: RootState) => state.loyalty.program;
export const selectProgramLoading = (state: RootState) => state.loyalty.programLoading;
export const selectProgramError = (state: RootState) => state.loyalty.programError;

export const selectLoyaltyTiers = (state: RootState) => state.loyalty.tiers;
export const selectTiersLoading = (state: RootState) => state.loyalty.tiersLoading;
export const selectTiersError = (state: RootState) => state.loyalty.tiersError;

export const selectLoyaltyRewards = (state: RootState) => state.loyalty.rewards;
export const selectRewardsLoading = (state: RootState) => state.loyalty.rewardsLoading;
export const selectRewardsError = (state: RootState) => state.loyalty.rewardsError;

// ==================== REDUCER ====================
export default loyaltySlice.reducer;
