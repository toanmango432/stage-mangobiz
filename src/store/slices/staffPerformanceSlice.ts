/**
 * Staff Performance Slice
 * Manages performance metrics, achievements, and reviews for staff members.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { performanceDB } from '@/db/performanceOperations';
import type { RootState } from '../index';
import type {
  PerformancePeriod,
  PerformanceMetrics,
  Achievement,
  ReviewSummary,
  StaffReview,
} from '@/types/performance';

// ============================================
// STATE TYPES
// ============================================

interface StaffPerformanceData {
  metrics: PerformanceMetrics | null;
  achievements: Achievement[];
  reviewSummary: ReviewSummary | null;
  recentReviews: StaffReview[];
  lastFetched: string | null;
}

interface StaffPerformanceState {
  // Cached data by staff ID
  byStaffId: Record<string, StaffPerformanceData>;

  // Current view state
  currentStaffId: string | null;
  currentPeriod: PerformancePeriod;

  // Loading states
  loading: {
    metrics: boolean;
    achievements: boolean;
    reviews: boolean;
  };

  // Errors
  error: string | null;
}

const initialState: StaffPerformanceState = {
  byStaffId: {},
  currentStaffId: null,
  currentPeriod: 'monthly',
  loading: {
    metrics: false,
    achievements: false,
    reviews: false,
  },
  error: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Fetch performance metrics for a staff member
 */
export const fetchStaffMetrics = createAsyncThunk(
  'staffPerformance/fetchMetrics',
  async (
    {
      storeId,
      staffId,
      period,
      referenceDate,
    }: {
      storeId: string;
      staffId: string;
      period: PerformancePeriod;
      referenceDate?: Date;
    },
    { rejectWithValue }
  ) => {
    try {
      const metrics = await performanceDB.getStaffPerformanceMetrics(
        storeId,
        staffId,
        period,
        referenceDate || new Date()
      );
      return { staffId, metrics };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch metrics');
    }
  }
);

/**
 * Fetch achievements for a staff member
 */
export const fetchStaffAchievements = createAsyncThunk(
  'staffPerformance/fetchAchievements',
  async (
    { storeId, staffId }: { storeId: string; staffId: string },
    { rejectWithValue }
  ) => {
    try {
      const achievements = await performanceDB.getStaffAchievements(storeId, staffId);
      return { staffId, achievements };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch achievements');
    }
  }
);

/**
 * Fetch review summary for a staff member
 */
export const fetchStaffReviewSummary = createAsyncThunk(
  'staffPerformance/fetchReviewSummary',
  async ({ staffId }: { staffId: string }, { rejectWithValue }) => {
    try {
      const reviewSummary = await performanceDB.getStaffReviewSummary(staffId);
      return { staffId, reviewSummary };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch review summary');
    }
  }
);

/**
 * Fetch recent reviews for a staff member
 */
export const fetchStaffReviews = createAsyncThunk(
  'staffPerformance/fetchReviews',
  async ({ staffId, limit = 10 }: { staffId: string; limit?: number }, { rejectWithValue }) => {
    try {
      const reviews = await performanceDB.getStaffReviews(staffId, limit);
      return { staffId, reviews };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch reviews');
    }
  }
);

/**
 * Fetch all performance data for a staff member
 */
export const fetchAllStaffPerformanceData = createAsyncThunk(
  'staffPerformance/fetchAll',
  async (
    {
      storeId,
      staffId,
      period,
    }: {
      storeId: string;
      staffId: string;
      period: PerformancePeriod;
    },
    { dispatch }
  ) => {
    // Dispatch all fetches in parallel
    await Promise.all([
      dispatch(fetchStaffMetrics({ storeId, staffId, period })),
      dispatch(fetchStaffAchievements({ storeId, staffId })),
      dispatch(fetchStaffReviewSummary({ staffId })),
      dispatch(fetchStaffReviews({ staffId })),
    ]);

    return { staffId };
  }
);

// ============================================
// SLICE
// ============================================

const staffPerformanceSlice = createSlice({
  name: 'staffPerformance',
  initialState,
  reducers: {
    // Set current staff and period
    setCurrentStaff: (state, action: PayloadAction<string>) => {
      state.currentStaffId = action.payload;
    },

    setCurrentPeriod: (state, action: PayloadAction<PerformancePeriod>) => {
      state.currentPeriod = action.payload;
    },

    // Clear data for a staff member
    clearStaffData: (state, action: PayloadAction<string>) => {
      delete state.byStaffId[action.payload];
    },

    // Clear all cached data
    clearAllData: (state) => {
      state.byStaffId = {};
      state.currentStaffId = null;
      state.error = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch metrics
    builder
      .addCase(fetchStaffMetrics.pending, (state) => {
        state.loading.metrics = true;
        state.error = null;
      })
      .addCase(fetchStaffMetrics.fulfilled, (state, action) => {
        state.loading.metrics = false;
        const { staffId, metrics } = action.payload;

        if (!state.byStaffId[staffId]) {
          state.byStaffId[staffId] = {
            metrics: null,
            achievements: [],
            reviewSummary: null,
            recentReviews: [],
            lastFetched: null,
          };
        }

        state.byStaffId[staffId].metrics = metrics;
        state.byStaffId[staffId].lastFetched = new Date().toISOString();
      })
      .addCase(fetchStaffMetrics.rejected, (state, action) => {
        state.loading.metrics = false;
        state.error = action.payload as string;
      });

    // Fetch achievements
    builder
      .addCase(fetchStaffAchievements.pending, (state) => {
        state.loading.achievements = true;
        state.error = null;
      })
      .addCase(fetchStaffAchievements.fulfilled, (state, action) => {
        state.loading.achievements = false;
        const { staffId, achievements } = action.payload;

        if (!state.byStaffId[staffId]) {
          state.byStaffId[staffId] = {
            metrics: null,
            achievements: [],
            reviewSummary: null,
            recentReviews: [],
            lastFetched: null,
          };
        }

        state.byStaffId[staffId].achievements = achievements;
      })
      .addCase(fetchStaffAchievements.rejected, (state, action) => {
        state.loading.achievements = false;
        state.error = action.payload as string;
      });

    // Fetch review summary
    builder
      .addCase(fetchStaffReviewSummary.pending, (state) => {
        state.loading.reviews = true;
        state.error = null;
      })
      .addCase(fetchStaffReviewSummary.fulfilled, (state, action) => {
        state.loading.reviews = false;
        const { staffId, reviewSummary } = action.payload;

        if (!state.byStaffId[staffId]) {
          state.byStaffId[staffId] = {
            metrics: null,
            achievements: [],
            reviewSummary: null,
            recentReviews: [],
            lastFetched: null,
          };
        }

        state.byStaffId[staffId].reviewSummary = reviewSummary;
      })
      .addCase(fetchStaffReviewSummary.rejected, (state, action) => {
        state.loading.reviews = false;
        state.error = action.payload as string;
      });

    // Fetch reviews
    builder
      .addCase(fetchStaffReviews.fulfilled, (state, action) => {
        const { staffId, reviews } = action.payload;

        if (!state.byStaffId[staffId]) {
          state.byStaffId[staffId] = {
            metrics: null,
            achievements: [],
            reviewSummary: null,
            recentReviews: [],
            lastFetched: null,
          };
        }

        state.byStaffId[staffId].recentReviews = reviews;
      });
  },
});

// ============================================
// EXPORTS
// ============================================

export const {
  setCurrentStaff,
  setCurrentPeriod,
  clearStaffData,
  clearAllData,
  clearError,
} = staffPerformanceSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectStaffPerformanceData = (state: RootState, staffId: string) =>
  state.staffPerformance?.byStaffId[staffId] || null;

export const selectStaffMetrics = (state: RootState, staffId: string) =>
  state.staffPerformance?.byStaffId[staffId]?.metrics || null;

export const selectStaffAchievements = (state: RootState, staffId: string) =>
  state.staffPerformance?.byStaffId[staffId]?.achievements || [];

export const selectStaffReviewSummary = (state: RootState, staffId: string) =>
  state.staffPerformance?.byStaffId[staffId]?.reviewSummary || null;

export const selectStaffRecentReviews = (state: RootState, staffId: string) =>
  state.staffPerformance?.byStaffId[staffId]?.recentReviews || [];

export const selectCurrentPeriod = (state: RootState) =>
  state.staffPerformance?.currentPeriod || 'monthly';

export const selectPerformanceLoading = (state: RootState) =>
  state.staffPerformance?.loading || { metrics: false, achievements: false, reviews: false };

export const selectPerformanceError = (state: RootState) =>
  state.staffPerformance?.error || null;

export default staffPerformanceSlice.reducer;
