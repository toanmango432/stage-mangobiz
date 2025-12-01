/**
 * Staff Schedule Redux Slice
 * State management for multi-week staff working patterns
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type {
  StaffSchedule,
  CreateStaffScheduleInput,
} from '../../types/schedule/staffSchedule';
import { staffSchedulesDB } from '../../db/scheduleDatabase';

// ==================== STATE INTERFACE ====================

interface StaffScheduleState {
  // All staff schedules by staff ID for quick lookup
  byStaffId: Record<string, StaffSchedule[]>;
  // Current active schedule per staff
  currentByStaffId: Record<string, StaffSchedule | null>;
  // All schedules for the store
  items: StaffSchedule[];
  // Loading states
  loading: boolean;
  loadingByStaff: Record<string, boolean>;
  // Errors
  error: string | null;
  // Last fetch timestamps
  lastFetched: string | null;
  lastFetchedByStaff: Record<string, string>;
  // UI State
  ui: {
    selectedStaffId: string | null;
    selectedScheduleId: string | null;
    editingWeekNumber: number;
    isModalOpen: boolean;
  };
}

const initialState: StaffScheduleState = {
  byStaffId: {},
  currentByStaffId: {},
  items: [],
  loading: false,
  loadingByStaff: {},
  error: null,
  lastFetched: null,
  lastFetchedByStaff: {},
  ui: {
    selectedStaffId: null,
    selectedScheduleId: null,
    editingWeekNumber: 1,
    isModalOpen: false,
  },
};

// ==================== ASYNC THUNKS ====================

/**
 * Fetch all staff schedules for a store
 */
export const fetchStaffSchedules = createAsyncThunk(
  'staffSchedule/fetchAll',
  async (storeId: string, { rejectWithValue }) => {
    try {
      return await staffSchedulesDB.getByStore(storeId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch staff schedules'
      );
    }
  }
);

/**
 * Fetch schedules for a specific staff member
 */
export const fetchStaffSchedulesByStaff = createAsyncThunk(
  'staffSchedule/fetchByStaff',
  async (staffId: string, { rejectWithValue }) => {
    try {
      const schedules = await staffSchedulesDB.getByStaff(staffId);
      return { staffId, schedules };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch staff schedule'
      );
    }
  }
);

/**
 * Fetch the current active schedule for a staff member
 */
export const fetchCurrentStaffSchedule = createAsyncThunk(
  'staffSchedule/fetchCurrent',
  async (staffId: string, { rejectWithValue }) => {
    try {
      const schedule = await staffSchedulesDB.getCurrentForStaff(staffId);
      return { staffId, schedule: schedule || null };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch current staff schedule'
      );
    }
  }
);

/**
 * Create a new staff schedule
 */
export const createStaffSchedule = createAsyncThunk(
  'staffSchedule/create',
  async (
    {
      input,
      context,
    }: {
      input: CreateStaffScheduleInput;
      context: {
        userId: string;
        storeId: string;
        tenantId: string;
        deviceId: string;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      return await staffSchedulesDB.create(
        input,
        context.userId,
        context.storeId,
        context.tenantId,
        context.deviceId
      );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create staff schedule'
      );
    }
  }
);

/**
 * Update an existing staff schedule
 */
export const updateStaffSchedule = createAsyncThunk(
  'staffSchedule/update',
  async (
    {
      id,
      updates,
      userId,
      deviceId,
    }: {
      id: string;
      updates: Partial<CreateStaffScheduleInput>;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await staffSchedulesDB.update(id, updates, userId, deviceId);
      if (!result) {
        return rejectWithValue('Schedule not found');
      }
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update staff schedule'
      );
    }
  }
);

/**
 * Delete a staff schedule
 */
export const deleteStaffSchedule = createAsyncThunk(
  'staffSchedule/delete',
  async (
    {
      id,
      userId,
      deviceId,
    }: {
      id: string;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await staffSchedulesDB.delete(id, userId, deviceId);
      if (!result) {
        return rejectWithValue('Schedule not found');
      }
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete staff schedule'
      );
    }
  }
);

// ==================== SLICE ====================

const staffScheduleSlice = createSlice({
  name: 'staffSchedule',
  initialState,
  reducers: {
    // UI Actions
    setSelectedStaffId: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedStaffId = action.payload;
    },
    setSelectedScheduleId: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedScheduleId = action.payload;
    },
    setEditingWeekNumber: (state, action: PayloadAction<number>) => {
      state.ui.editingWeekNumber = action.payload;
    },
    openScheduleModal: (state, action: PayloadAction<{ staffId?: string; scheduleId?: string }>) => {
      state.ui.isModalOpen = true;
      state.ui.selectedStaffId = action.payload.staffId || null;
      state.ui.selectedScheduleId = action.payload.scheduleId || null;
      state.ui.editingWeekNumber = 1;
    },
    closeScheduleModal: (state) => {
      state.ui.isModalOpen = false;
      state.ui.selectedScheduleId = null;
      state.ui.editingWeekNumber = 1;
    },
    clearStaffScheduleError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all schedules
      .addCase(fetchStaffSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = new Date().toISOString();
        // Organize by staff ID
        state.byStaffId = {};
        action.payload.forEach((schedule) => {
          if (!state.byStaffId[schedule.staffId]) {
            state.byStaffId[schedule.staffId] = [];
          }
          state.byStaffId[schedule.staffId].push(schedule);
        });
      })
      .addCase(fetchStaffSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch by staff
      .addCase(fetchStaffSchedulesByStaff.pending, (state, action) => {
        state.loadingByStaff[action.meta.arg] = true;
      })
      .addCase(fetchStaffSchedulesByStaff.fulfilled, (state, action) => {
        const { staffId, schedules } = action.payload;
        state.loadingByStaff[staffId] = false;
        state.byStaffId[staffId] = schedules;
        state.lastFetchedByStaff[staffId] = new Date().toISOString();
      })
      .addCase(fetchStaffSchedulesByStaff.rejected, (state, action) => {
        state.loadingByStaff[action.meta.arg] = false;
        state.error = action.payload as string;
      })
      // Fetch current schedule
      .addCase(fetchCurrentStaffSchedule.pending, (state, action) => {
        state.loadingByStaff[action.meta.arg] = true;
      })
      .addCase(fetchCurrentStaffSchedule.fulfilled, (state, action) => {
        const { staffId, schedule } = action.payload;
        state.loadingByStaff[staffId] = false;
        state.currentByStaffId[staffId] = schedule;
      })
      .addCase(fetchCurrentStaffSchedule.rejected, (state, action) => {
        state.loadingByStaff[action.meta.arg] = false;
        state.error = action.payload as string;
      })
      // Create schedule
      .addCase(createStaffSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStaffSchedule.fulfilled, (state, action) => {
        state.loading = false;
        const schedule = action.payload;
        state.items.push(schedule);
        if (!state.byStaffId[schedule.staffId]) {
          state.byStaffId[schedule.staffId] = [];
        }
        state.byStaffId[schedule.staffId].push(schedule);
        // Update current if this is now the active schedule
        const today = new Date().toISOString().split('T')[0];
        if (
          schedule.effectiveFrom <= today &&
          (!schedule.effectiveUntil || schedule.effectiveUntil >= today)
        ) {
          state.currentByStaffId[schedule.staffId] = schedule;
        }
      })
      .addCase(createStaffSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update schedule
      .addCase(updateStaffSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStaffSchedule.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        // Update in items array
        const itemIndex = state.items.findIndex((s) => s.id === updated.id);
        if (itemIndex >= 0) {
          state.items[itemIndex] = updated;
        }
        // Update in byStaffId
        if (state.byStaffId[updated.staffId]) {
          const staffIndex = state.byStaffId[updated.staffId].findIndex(
            (s) => s.id === updated.id
          );
          if (staffIndex >= 0) {
            state.byStaffId[updated.staffId][staffIndex] = updated;
          }
        }
        // Update current if applicable
        if (state.currentByStaffId[updated.staffId]?.id === updated.id) {
          state.currentByStaffId[updated.staffId] = updated;
        }
      })
      .addCase(updateStaffSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete schedule
      .addCase(deleteStaffSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStaffSchedule.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        // Find and remove from items
        const itemIndex = state.items.findIndex((s) => s.id === deletedId);
        if (itemIndex >= 0) {
          const schedule = state.items[itemIndex];
          state.items.splice(itemIndex, 1);
          // Remove from byStaffId
          if (state.byStaffId[schedule.staffId]) {
            state.byStaffId[schedule.staffId] = state.byStaffId[schedule.staffId].filter(
              (s) => s.id !== deletedId
            );
          }
          // Clear current if it was the deleted one
          if (state.currentByStaffId[schedule.staffId]?.id === deletedId) {
            state.currentByStaffId[schedule.staffId] = null;
          }
        }
      })
      .addCase(deleteStaffSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ==================== ACTIONS ====================

export const {
  setSelectedStaffId,
  setSelectedScheduleId,
  setEditingWeekNumber,
  openScheduleModal,
  closeScheduleModal,
  clearStaffScheduleError,
} = staffScheduleSlice.actions;

// ==================== SELECTORS ====================

export const selectStaffScheduleState = (state: RootState) => state.staffSchedule;

export const selectStaffSchedules = (state: RootState) => state.staffSchedule.items;

export const selectStaffSchedulesLoading = (state: RootState) => state.staffSchedule.loading;

export const selectStaffSchedulesError = (state: RootState) => state.staffSchedule.error;

export const selectStaffSchedulesByStaffId = (state: RootState, staffId: string) =>
  state.staffSchedule.byStaffId[staffId] || [];

export const selectCurrentStaffSchedule = (state: RootState, staffId: string) =>
  state.staffSchedule.currentByStaffId[staffId] || null;

export const selectStaffScheduleLoadingByStaff = (state: RootState, staffId: string) =>
  state.staffSchedule.loadingByStaff[staffId] || false;

export const selectStaffScheduleUI = (state: RootState) => state.staffSchedule.ui;

export const selectSelectedStaffSchedule = (state: RootState) => {
  const scheduleId = state.staffSchedule.ui.selectedScheduleId;
  if (!scheduleId) return null;
  return state.staffSchedule.items.find((s) => s.id === scheduleId) || null;
};

export const selectEditingWeekNumber = (state: RootState) =>
  state.staffSchedule.ui.editingWeekNumber;

export const selectScheduleModalOpen = (state: RootState) =>
  state.staffSchedule.ui.isModalOpen;

// ==================== EXPORT ====================

export default staffScheduleSlice.reducer;
