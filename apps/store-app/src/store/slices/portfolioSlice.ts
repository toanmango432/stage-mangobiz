/**
 * Portfolio Slice
 * Redux state management for staff portfolio items
 */

import { createSlice, createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { portfolioTable } from '@/services/supabase/tables/portfolioTable';
import { toPortfolioItem, toPortfolioInsert } from '@/services/supabase/adapters/portfolioAdapter';
import type { PortfolioItem } from '@/types/performance';
import type { RootState } from '@/store';

// ============================================
// STATE INTERFACE
// ============================================

interface PortfolioState {
  items: Record<string, PortfolioItem>;
  itemIds: string[];
  loading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  items: {},
  itemIds: [],
  loading: false,
  error: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchPortfolioByStaff = createAsyncThunk(
  'portfolio/fetchByStaff',
  async (staffId: string, { rejectWithValue }) => {
    try {
      const rows = await portfolioTable.getByStaffId(staffId);
      return rows.map(toPortfolioItem);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch portfolio');
    }
  }
);

export const createPortfolioItem = createAsyncThunk(
  'portfolio/create',
  async (item: Omit<PortfolioItem, 'id' | 'createdAt' | 'likes'>, { rejectWithValue }) => {
    try {
      const insert = toPortfolioInsert(item);
      const row = await portfolioTable.create(insert);
      return toPortfolioItem(row);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create portfolio item');
    }
  }
);

export const updatePortfolioItem = createAsyncThunk(
  'portfolio/update',
  async ({ id, changes }: { id: string; changes: Partial<PortfolioItem> }, { rejectWithValue }) => {
    try {
      const row = await portfolioTable.update(id, {
        title: changes.title,
        description: changes.description,
        tags: changes.tags,
        service_name: changes.serviceName,
      });
      return toPortfolioItem(row);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update portfolio item');
    }
  }
);

export const deletePortfolioItem = createAsyncThunk(
  'portfolio/delete',
  async (itemId: string, { rejectWithValue }) => {
    try {
      await portfolioTable.delete(itemId);
      return itemId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete portfolio item');
    }
  }
);

export const togglePortfolioFeatured = createAsyncThunk(
  'portfolio/toggleFeatured',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const row = await portfolioTable.toggleFeatured(itemId);
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
    clearPortfolioError: (state) => {
      state.error = null;
    },
    clearPortfolio: (state) => {
      state.items = {};
      state.itemIds = [];
      state.error = null;
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
        state.items = {};
        state.itemIds = [];
        action.payload.forEach((item) => {
          state.items[item.id] = item;
          state.itemIds.push(item.id);
        });
      })
      .addCase(fetchPortfolioByStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create item
    builder
      .addCase(createPortfolioItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPortfolioItem.fulfilled, (state, action: PayloadAction<PortfolioItem>) => {
        state.loading = false;
        const item = action.payload;
        state.items[item.id] = item;
        state.itemIds.unshift(item.id);
      })
      .addCase(createPortfolioItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update item
    builder
      .addCase(updatePortfolioItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePortfolioItem.fulfilled, (state, action: PayloadAction<PortfolioItem>) => {
        state.loading = false;
        const item = action.payload;
        state.items[item.id] = item;
      })
      .addCase(updatePortfolioItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete item
    builder
      .addCase(deletePortfolioItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePortfolioItem.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        const itemId = action.payload;
        delete state.items[itemId];
        state.itemIds = state.itemIds.filter((id) => id !== itemId);
      })
      .addCase(deletePortfolioItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Toggle featured
    builder
      .addCase(togglePortfolioFeatured.pending, (state) => {
        state.error = null;
      })
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

export const { clearPortfolioError, clearPortfolio } = portfolioSlice.actions;

// ============================================
// SELECTORS
// ============================================

const selectPortfolioState = (state: RootState) => state.portfolio;

export const selectPortfolioLoading = (state: RootState) => state.portfolio.loading;
export const selectPortfolioError = (state: RootState) => state.portfolio.error;

export const selectPortfolioItems = createSelector([selectPortfolioState], (portfolio) =>
  portfolio.itemIds.map((id: string) => portfolio.items[id]).filter(Boolean) as PortfolioItem[]
);

export const selectPortfolioByStaff = createSelector(
  [selectPortfolioState, (_state: RootState, staffId: string) => staffId],
  (portfolio, staffId) =>
    portfolio.itemIds
      .map((id: string) => portfolio.items[id])
      .filter((item): item is PortfolioItem => item !== undefined && item.staffId === staffId)
);

export const selectFeaturedPortfolio = createSelector([selectPortfolioState], (portfolio) =>
  portfolio.itemIds
    .map((id: string) => portfolio.items[id])
    .filter((item): item is PortfolioItem => item !== undefined && item.isFeatured)
);

export const selectPortfolioItem = (state: RootState, itemId: string) =>
  state.portfolio.items[itemId];

// ============================================
// REDUCER
// ============================================

export default portfolioSlice.reducer;
