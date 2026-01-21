/**
 * Portfolio Slice
 *
 * Redux state management for staff portfolio items.
 */

import { createSlice, createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { PortfolioItem } from '../../types/performance';
import { SyncContext, getDefaultSyncContext } from '../utils/syncContext';

// ============================================
// STATE TYPES
// ============================================

export interface PortfolioState {
  // Data (normalized by item ID)
  items: Record<string, PortfolioItem>;
  itemIds: string[];

  // Loading states
  loading: boolean;
  error: string | null;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: PortfolioState = {
  items: {},
  itemIds: [],
  loading: false,
  error: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Fetch portfolio items for a staff member
 */
export const fetchPortfolioByStaff = createAsyncThunk(
  'portfolio/fetchByStaff',
  async (staffId: string, { rejectWithValue }) => {
    try {
      const { portfolioTable } = await import('../../services/supabase/tables/portfolioTable');
      const { toPortfolioItems } = await import('../../services/supabase/adapters/portfolioAdapter');
      const rows = await portfolioTable.getByStaffId(staffId);
      return toPortfolioItems(rows);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch portfolio');
    }
  }
);

/**
 * Create a new portfolio item
 */
export const createPortfolioItem = createAsyncThunk(
  'portfolio/create',
  async (
    {
      item,
      storeId,
      context,
    }: {
      item: Omit<PortfolioItem, 'id' | 'createdAt'>;
      storeId: string;
      context?: SyncContext;
    },
    { rejectWithValue }
  ) => {
    try {
      const { portfolioTable } = await import('../../services/supabase/tables/portfolioTable');
      const { toPortfolioInsert, toPortfolioItem } = await import(
        '../../services/supabase/adapters/portfolioAdapter'
      );
      const _ctx = context || getDefaultSyncContext();
      const insertData = toPortfolioInsert(item, storeId);
      const row = await portfolioTable.create(insertData);
      return toPortfolioItem(row);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create portfolio item');
    }
  }
);

/**
 * Update a portfolio item
 */
export const updatePortfolioItem = createAsyncThunk(
  'portfolio/update',
  async (
    { id, updates, context }: { id: string; updates: Partial<PortfolioItem>; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { portfolioTable } = await import('../../services/supabase/tables/portfolioTable');
      const { toPortfolioUpdate, toPortfolioItem } = await import(
        '../../services/supabase/adapters/portfolioAdapter'
      );
      const _ctx = context || getDefaultSyncContext();
      const updateData = toPortfolioUpdate(updates);
      const row = await portfolioTable.update(id, updateData);
      return toPortfolioItem(row);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update portfolio item');
    }
  }
);

/**
 * Delete a portfolio item
 */
export const deletePortfolioItem = createAsyncThunk(
  'portfolio/delete',
  async ({ id, context }: { id: string; context?: SyncContext }, { rejectWithValue }) => {
    try {
      const { portfolioTable } = await import('../../services/supabase/tables/portfolioTable');
      const _ctx = context || getDefaultSyncContext();
      await portfolioTable.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete portfolio item');
    }
  }
);

/**
 * Toggle featured status of a portfolio item
 */
export const togglePortfolioFeatured = createAsyncThunk(
  'portfolio/toggleFeatured',
  async ({ id, context }: { id: string; context?: SyncContext }, { rejectWithValue }) => {
    try {
      const { portfolioTable } = await import('../../services/supabase/tables/portfolioTable');
      const { toPortfolioItem } = await import('../../services/supabase/adapters/portfolioAdapter');
      const _ctx = context || getDefaultSyncContext();
      const row = await portfolioTable.toggleFeatured(id);
      return toPortfolioItem(row);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to toggle featured');
    }
  }
);

// ============================================
// SLICE
// ============================================

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearPortfolio(state) {
      state.items = {};
      state.itemIds = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch by staff
    builder
      .addCase(fetchPortfolioByStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolioByStaff.fulfilled, (state, action: PayloadAction<PortfolioItem[]>) => {
        state.loading = false;
        // Normalize data
        const items: Record<string, PortfolioItem> = {};
        const ids: string[] = [];
        action.payload.forEach((item) => {
          items[item.id] = item;
          ids.push(item.id);
        });
        state.items = items;
        state.itemIds = ids;
      })
      .addCase(fetchPortfolioByStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create
    builder
      .addCase(createPortfolioItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPortfolioItem.fulfilled, (state, action: PayloadAction<PortfolioItem>) => {
        state.loading = false;
        const item = action.payload;
        state.items[item.id] = item;
        state.itemIds.unshift(item.id); // Add to beginning
      })
      .addCase(createPortfolioItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update
    builder
      .addCase(updatePortfolioItem.fulfilled, (state, action: PayloadAction<PortfolioItem>) => {
        const item = action.payload;
        state.items[item.id] = item;
      })
      .addCase(updatePortfolioItem.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Delete
    builder
      .addCase(deletePortfolioItem.fulfilled, (state, action: PayloadAction<string>) => {
        const id = action.payload;
        delete state.items[id];
        state.itemIds = state.itemIds.filter((itemId) => itemId !== id);
      })
      .addCase(deletePortfolioItem.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Toggle featured
    builder
      .addCase(togglePortfolioFeatured.fulfilled, (state, action: PayloadAction<PortfolioItem>) => {
        const item = action.payload;
        state.items[item.id] = item;
      })
      .addCase(togglePortfolioFeatured.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// ============================================
// ACTIONS
// ============================================

export const { clearError, clearPortfolio } = portfolioSlice.actions;

// ============================================
// SELECTORS
// ============================================

const selectPortfolioState = (state: RootState) => state.portfolio;

export const selectPortfolioItems = createSelector([selectPortfolioState], (portfolio) =>
  portfolio.itemIds.map((id: string) => portfolio.items[id]).filter(Boolean)
);

export const selectPortfolioByStaff = createSelector(
  [selectPortfolioState, (_state: RootState, staffId: string) => staffId],
  (portfolio, staffId) =>
    portfolio.itemIds
      .map((id: string) => portfolio.items[id])
      .filter((item: PortfolioItem | undefined) => item && item.staffId === staffId) as PortfolioItem[]
);

export const selectPortfolioItem = createSelector(
  [selectPortfolioState, (_state: RootState, itemId: string) => itemId],
  (portfolio, itemId) => portfolio.items[itemId] || null
);

export const selectPortfolioLoading = createSelector(
  [selectPortfolioState],
  (portfolio) => portfolio.loading
);

export const selectPortfolioError = createSelector(
  [selectPortfolioState],
  (portfolio) => portfolio.error
);

export const selectFeaturedPortfolio = createSelector([selectPortfolioState], (portfolio) =>
  portfolio.itemIds
    .map((id: string) => portfolio.items[id])
    .filter((item: PortfolioItem | undefined) => item && item.isFeatured) as PortfolioItem[]
);

// ============================================
// EXPORT REDUCER
// ============================================

export default portfolioSlice.reducer;
