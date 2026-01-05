/**
 * Schedule Redux Slice
 * State management for Time-Off, Blocked Time, Resources, and Staff Schedules
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type {
  TimeOffType,
  TimeOffRequest,
  CreateTimeOffTypeInput,
  UpdateTimeOffTypeInput,
  CreateTimeOffRequestInput,
  TimeOffRequestFilters,
  BlockedTimeType,
  BlockedTimeEntry,
  CreateBlockedTimeTypeInput,
  UpdateBlockedTimeTypeInput,
  CreateBlockedTimeEntryInput,
  BusinessClosedPeriod,
  CreateBusinessClosedPeriodInput,
} from '../../types/schedule';
import {
  timeOffTypesDB,
  timeOffRequestsDB,
  blockedTimeTypesDB,
  blockedTimeEntriesDB,
  businessClosedPeriodsDB,
} from '../../db/scheduleDatabase';
import {
  ScheduleError,
  TimeOffTypeNotFoundError,
  CannotDeleteSystemDefaultError,
  BlockedTimeTypeNotFoundError,
  CannotDeleteDefaultBlockedTimeTypeError,
} from '../../types/schedule/errors';

// ==================== STATE INTERFACE ====================

export type ScheduleModalType =
  | 'none'
  | 'createTimeOffType'
  | 'editTimeOffType'
  | 'createTimeOffRequest'
  | 'approveRequest'
  | 'denyRequest'
  | 'createBlockedTimeType'
  | 'editBlockedTimeType'
  | 'blockTime'
  | 'editBlockedTimeEntry'
  | 'createClosedPeriod'
  | 'editClosedPeriod';

// Blocked Time Filters
export interface BlockedTimeFilters {
  staffId: string | null;
  typeId: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface ScheduleState {
  // Time-Off Types
  timeOffTypes: {
    items: TimeOffType[];
    loading: boolean;
    error: string | null;
    lastFetched: string | null;
  };

  // Time-Off Requests
  timeOffRequests: {
    items: TimeOffRequest[];
    pendingCount: number;
    loading: boolean;
    error: string | null;
    filters: TimeOffRequestFilters;
    lastFetched: string | null;
  };

  // Blocked Time Types
  blockedTimeTypes: {
    items: BlockedTimeType[];
    loading: boolean;
    error: string | null;
    lastFetched: string | null;
  };

  // Blocked Time Entries
  blockedTimeEntries: {
    items: BlockedTimeEntry[];
    loading: boolean;
    error: string | null;
    filters: BlockedTimeFilters;
    lastFetched: string | null;
  };

  // Business Closed Periods
  closedPeriods: {
    items: BusinessClosedPeriod[];
    loading: boolean;
    error: string | null;
    lastFetched: string | null;
  };

  // UI State
  ui: {
    activeModal: ScheduleModalType;
    selectedTimeOffTypeId: string | null;
    selectedRequestId: string | null;
    selectedBlockedTimeTypeId: string | null;
    selectedBlockedTimeEntryId: string | null;
    blockTimeModalOpen: boolean;
    blockTimeModalContext: {
      staffId: string | null;
      date: string | null;
      startTime: string | null;
    } | null;
    selectedClosedPeriodId: string | null;
  };
}

const initialState: ScheduleState = {
  timeOffTypes: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  timeOffRequests: {
    items: [],
    pendingCount: 0,
    loading: false,
    error: null,
    filters: {
      status: 'pending',
      staffId: null,
      typeId: null,
      dateRange: 'upcoming',
    },
    lastFetched: null,
  },
  blockedTimeTypes: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  blockedTimeEntries: {
    items: [],
    loading: false,
    error: null,
    filters: {
      staffId: null,
      typeId: null,
      startDate: null,
      endDate: null,
    },
    lastFetched: null,
  },
  closedPeriods: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  ui: {
    activeModal: 'none',
    selectedTimeOffTypeId: null,
    selectedRequestId: null,
    selectedBlockedTimeTypeId: null,
    selectedBlockedTimeEntryId: null,
    blockTimeModalOpen: false,
    blockTimeModalContext: null,
    selectedClosedPeriodId: null,
  },
};

// ==================== ASYNC THUNKS: TIME-OFF TYPES ====================

export const fetchTimeOffTypes = createAsyncThunk(
  'schedule/fetchTimeOffTypes',
  async (storeId: string, { rejectWithValue }) => {
    try {
      return await timeOffTypesDB.getAll(storeId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch time-off types'
      );
    }
  }
);

export const fetchAllTimeOffTypes = createAsyncThunk(
  'schedule/fetchAllTimeOffTypes',
  async (storeId: string, { rejectWithValue }) => {
    try {
      return await timeOffTypesDB.getAllIncludingInactive(storeId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch time-off types'
      );
    }
  }
);

export const createTimeOffType = createAsyncThunk(
  'schedule/createTimeOffType',
  async (
    {
      input,
      userId,
      storeId,
      tenantId,
      deviceId,
    }: {
      input: CreateTimeOffTypeInput;
      userId: string;
      storeId: string;
      tenantId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await timeOffTypesDB.create(input, userId, storeId, tenantId, deviceId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create time-off type'
      );
    }
  }
);

export const updateTimeOffType = createAsyncThunk(
  'schedule/updateTimeOffType',
  async (
    {
      id,
      updates,
      userId,
      deviceId,
    }: {
      id: string;
      updates: UpdateTimeOffTypeInput;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await timeOffTypesDB.update(id, updates, userId, deviceId);
      if (!result) {
        throw new TimeOffTypeNotFoundError(id);
      }
      return result;
    } catch (error) {
      if (error instanceof ScheduleError) {
        return rejectWithValue({ code: error.code, message: error.message });
      }
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update time-off type'
      );
    }
  }
);

export const deleteTimeOffType = createAsyncThunk(
  'schedule/deleteTimeOffType',
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
    { getState, rejectWithValue }
  ) => {
    try {
      // Check if system default before attempting delete
      const state = getState() as RootState;
      const type = state.schedule.timeOffTypes.items.find(t => t.id === id);
      if (type?.isSystemDefault) {
        throw new CannotDeleteSystemDefaultError(id, type.name);
      }

      const success = await timeOffTypesDB.delete(id, userId, deviceId);
      if (!success) {
        throw new TimeOffTypeNotFoundError(id);
      }
      return id;
    } catch (error) {
      if (error instanceof ScheduleError) {
        return rejectWithValue({ code: error.code, message: error.message });
      }
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete time-off type'
      );
    }
  }
);

export const seedTimeOffTypes = createAsyncThunk(
  'schedule/seedTimeOffTypes',
  async (
    {
      storeId,
      tenantId,
      userId,
      deviceId,
    }: {
      storeId: string;
      tenantId: string;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await timeOffTypesDB.seedDefaults(storeId, tenantId, userId, deviceId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to seed time-off types'
      );
    }
  }
);

// ==================== ASYNC THUNKS: TIME-OFF REQUESTS ====================

export const fetchTimeOffRequests = createAsyncThunk(
  'schedule/fetchTimeOffRequests',
  async (
    {
      storeId,
      filters,
    }: {
      storeId: string;
      filters?: Partial<TimeOffRequestFilters>;
    },
    { rejectWithValue }
  ) => {
    try {
      return await timeOffRequestsDB.getAll(storeId, filters);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch time-off requests'
      );
    }
  }
);

export const fetchPendingCount = createAsyncThunk(
  'schedule/fetchPendingCount',
  async (storeId: string, { rejectWithValue }) => {
    try {
      return await timeOffRequestsDB.getPendingCount(storeId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch pending count'
      );
    }
  }
);

export const createTimeOffRequest = createAsyncThunk(
  'schedule/createTimeOffRequest',
  async (
    {
      input,
      userId,
      storeId,
      tenantId,
      deviceId,
    }: {
      input: CreateTimeOffRequestInput;
      userId: string;
      storeId: string;
      tenantId: string;
      deviceId: string;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      // Get type details for denormalization
      const state = getState() as RootState;
      const type = state.schedule.timeOffTypes.items.find(t => t.id === input.typeId);
      if (!type) {
        throw new TimeOffTypeNotFoundError(input.typeId);
      }

      // Calculate hours (simplified - assumes 8 hours per day)
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      const totalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      const totalHours = input.isAllDay ? totalDays * 8 : calculatePartialDayHours(input.startTime, input.endTime);

      // Check for conflicts (simplified - would call appointment DB in full implementation)
      const conflictingAppointmentIds: string[] = [];

      return await timeOffRequestsDB.create(
        input,
        {
          name: type.name,
          emoji: type.emoji,
          color: type.color,
          isPaid: type.isPaid,
          requiresApproval: type.requiresApproval,
        },
        totalHours,
        totalDays,
        conflictingAppointmentIds,
        userId,
        storeId,
        tenantId,
        deviceId
      );
    } catch (error) {
      if (error instanceof ScheduleError) {
        return rejectWithValue({ code: error.code, message: error.message });
      }
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create time-off request'
      );
    }
  }
);

export const approveTimeOffRequest = createAsyncThunk(
  'schedule/approveTimeOffRequest',
  async (
    {
      id,
      approverName,
      notes,
      userId,
      deviceId,
    }: {
      id: string;
      approverName: string;
      notes: string | null;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await timeOffRequestsDB.approve(id, approverName, notes, userId, deviceId);
      if (!result) {
        throw new Error('Request not found or not pending');
      }
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to approve request'
      );
    }
  }
);

export const denyTimeOffRequest = createAsyncThunk(
  'schedule/denyTimeOffRequest',
  async (
    {
      id,
      denierName,
      reason,
      userId,
      deviceId,
    }: {
      id: string;
      denierName: string;
      reason: string;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await timeOffRequestsDB.deny(id, denierName, reason, userId, deviceId);
      if (!result) {
        throw new Error('Request not found or not pending');
      }
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to deny request'
      );
    }
  }
);

export const cancelTimeOffRequest = createAsyncThunk(
  'schedule/cancelTimeOffRequest',
  async (
    {
      id,
      reason,
      userId,
      deviceId,
    }: {
      id: string;
      reason: string | null;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await timeOffRequestsDB.cancel(id, reason, userId, deviceId);
      if (!result) {
        throw new Error('Request not found or not pending');
      }
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to cancel request'
      );
    }
  }
);

// ==================== ASYNC THUNKS: BLOCKED TIME TYPES ====================

export const fetchBlockedTimeTypes = createAsyncThunk(
  'schedule/fetchBlockedTimeTypes',
  async (storeId: string, { rejectWithValue }) => {
    try {
      return await blockedTimeTypesDB.getAll(storeId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch blocked time types'
      );
    }
  }
);

export const fetchAllBlockedTimeTypes = createAsyncThunk(
  'schedule/fetchAllBlockedTimeTypes',
  async (storeId: string, { rejectWithValue }) => {
    try {
      return await blockedTimeTypesDB.getAllIncludingInactive(storeId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch blocked time types'
      );
    }
  }
);

export const createBlockedTimeType = createAsyncThunk(
  'schedule/createBlockedTimeType',
  async (
    {
      input,
      userId,
      storeId,
      tenantId,
      deviceId,
    }: {
      input: CreateBlockedTimeTypeInput;
      userId: string;
      storeId: string;
      tenantId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await blockedTimeTypesDB.create(input, userId, storeId, tenantId, deviceId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create blocked time type'
      );
    }
  }
);

export const updateBlockedTimeType = createAsyncThunk(
  'schedule/updateBlockedTimeType',
  async (
    {
      id,
      updates,
      userId,
      deviceId,
    }: {
      id: string;
      updates: UpdateBlockedTimeTypeInput;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await blockedTimeTypesDB.update(id, updates, userId, deviceId);
      if (!result) {
        throw new BlockedTimeTypeNotFoundError(id);
      }
      return result;
    } catch (error) {
      if (error instanceof ScheduleError) {
        return rejectWithValue({ code: error.code, message: error.message });
      }
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update blocked time type'
      );
    }
  }
);

export const deleteBlockedTimeType = createAsyncThunk(
  'schedule/deleteBlockedTimeType',
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
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const type = state.schedule.blockedTimeTypes.items.find(t => t.id === id);
      if (type?.isSystemDefault) {
        throw new CannotDeleteDefaultBlockedTimeTypeError(type.name);
      }

      const success = await blockedTimeTypesDB.delete(id, userId, deviceId);
      if (!success) {
        throw new BlockedTimeTypeNotFoundError(id);
      }
      return id;
    } catch (error) {
      if (error instanceof ScheduleError) {
        return rejectWithValue({ code: error.code, message: error.message });
      }
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete blocked time type'
      );
    }
  }
);

export const seedBlockedTimeTypes = createAsyncThunk(
  'schedule/seedBlockedTimeTypes',
  async (
    {
      storeId,
      tenantId,
      userId,
      deviceId,
    }: {
      storeId: string;
      tenantId: string;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await blockedTimeTypesDB.seedDefaults(storeId, tenantId, userId, deviceId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to seed blocked time types'
      );
    }
  }
);

// ==================== ASYNC THUNKS: BLOCKED TIME ENTRIES ====================

export const fetchBlockedTimeEntries = createAsyncThunk(
  'schedule/fetchBlockedTimeEntries',
  async (
    {
      storeId,
      filters,
    }: {
      storeId: string;
      filters?: Partial<BlockedTimeFilters>;
    },
    { rejectWithValue }
  ) => {
    try {
      return await blockedTimeEntriesDB.getAll(storeId, {
        staffId: filters?.staffId ?? undefined,
        startDate: filters?.startDate ?? undefined,
        endDate: filters?.endDate ?? undefined,
      });
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch blocked time entries'
      );
    }
  }
);

export const createBlockedTimeEntry = createAsyncThunk(
  'schedule/createBlockedTimeEntry',
  async (
    {
      input,
      userId,
      storeId,
      tenantId,
      deviceId,
      isManager = false,
    }: {
      input: CreateBlockedTimeEntryInput;
      userId: string;
      storeId: string;
      tenantId: string;
      deviceId: string;
      isManager?: boolean;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const type = state.schedule.blockedTimeTypes.items.find(t => t.id === input.typeId);
      if (!type) {
        throw new BlockedTimeTypeNotFoundError(input.typeId);
      }

      return await blockedTimeEntriesDB.create(
        input,
        {
          name: type.name,
          emoji: type.emoji,
          color: type.color,
          isPaid: type.isPaid,
        },
        userId,
        storeId,
        tenantId,
        deviceId,
        isManager
      );
    } catch (error) {
      if (error instanceof ScheduleError) {
        return rejectWithValue({ code: error.code, message: error.message });
      }
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create blocked time entry'
      );
    }
  }
);

export const deleteBlockedTimeEntry = createAsyncThunk(
  'schedule/deleteBlockedTimeEntry',
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
      const success = await blockedTimeEntriesDB.delete(id, userId, deviceId);
      if (!success) {
        throw new Error('Blocked time entry not found');
      }
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete blocked time entry'
      );
    }
  }
);

export const deleteBlockedTimeSeries = createAsyncThunk(
  'schedule/deleteBlockedTimeSeries',
  async (
    {
      seriesId,
      userId,
      deviceId,
    }: {
      seriesId: string;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const count = await blockedTimeEntriesDB.deleteSeries(seriesId, userId, deviceId);
      return { seriesId, deletedCount: count };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete blocked time series'
      );
    }
  }
);

// ==================== ASYNC THUNKS: BUSINESS CLOSED PERIODS ====================

export const fetchClosedPeriods = createAsyncThunk(
  'schedule/fetchClosedPeriods',
  async (storeId: string, { rejectWithValue }) => {
    try {
      return await businessClosedPeriodsDB.getAll(storeId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch closed periods'
      );
    }
  }
);

export const createClosedPeriod = createAsyncThunk(
  'schedule/createClosedPeriod',
  async (
    {
      input,
      userId,
      storeId,
      tenantId,
      deviceId,
    }: {
      input: CreateBusinessClosedPeriodInput;
      userId: string;
      storeId: string;
      tenantId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await businessClosedPeriodsDB.create(input, userId, storeId, tenantId, deviceId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create closed period'
      );
    }
  }
);

export const updateClosedPeriod = createAsyncThunk(
  'schedule/updateClosedPeriod',
  async (
    {
      id,
      updates,
      userId,
      deviceId,
    }: {
      id: string;
      updates: Partial<CreateBusinessClosedPeriodInput>;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await businessClosedPeriodsDB.update(id, updates, userId, deviceId);
      if (!result) {
        throw new Error('Closed period not found');
      }
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update closed period'
      );
    }
  }
);

export const deleteClosedPeriod = createAsyncThunk(
  'schedule/deleteClosedPeriod',
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
      const success = await businessClosedPeriodsDB.delete(id, userId, deviceId);
      if (!success) {
        throw new Error('Closed period not found');
      }
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete closed period'
      );
    }
  }
);

// ==================== HELPER FUNCTIONS ====================

function calculatePartialDayHours(startTime?: string | null, endTime?: string | null): number {
  if (!startTime || !endTime) return 8;

  const [startHours, startMins] = startTime.split(':').map(Number);
  const [endHours, endMins] = endTime.split(':').map(Number);

  const startMinutes = startHours * 60 + startMins;
  const endMinutes = endHours * 60 + endMins;

  return Math.max(0, (endMinutes - startMinutes) / 60);
}

// ==================== SLICE ====================

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    // --- Filter Actions ---
    setTimeOffRequestFilters: (state, action: PayloadAction<Partial<TimeOffRequestFilters>>) => {
      state.timeOffRequests.filters = {
        ...state.timeOffRequests.filters,
        ...action.payload,
      };
    },
    resetTimeOffRequestFilters: (state) => {
      state.timeOffRequests.filters = initialState.timeOffRequests.filters;
    },

    // --- UI Actions ---
    setActiveModal: (state, action: PayloadAction<ScheduleModalType>) => {
      state.ui.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.ui.activeModal = 'none';
      state.ui.selectedTimeOffTypeId = null;
      state.ui.selectedRequestId = null;
      state.ui.selectedBlockedTimeTypeId = null;
      state.ui.selectedBlockedTimeEntryId = null;
      state.ui.blockTimeModalOpen = false;
      state.ui.blockTimeModalContext = null;
    },
    setSelectedTimeOffTypeId: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedTimeOffTypeId = action.payload;
    },
    setSelectedRequestId: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedRequestId = action.payload;
    },
    openEditTimeOffTypeModal: (state, action: PayloadAction<string>) => {
      state.ui.selectedTimeOffTypeId = action.payload;
      state.ui.activeModal = 'editTimeOffType';
    },
    openApproveRequestModal: (state, action: PayloadAction<string>) => {
      state.ui.selectedRequestId = action.payload;
      state.ui.activeModal = 'approveRequest';
    },
    openDenyRequestModal: (state, action: PayloadAction<string>) => {
      state.ui.selectedRequestId = action.payload;
      state.ui.activeModal = 'denyRequest';
    },

    // --- Blocked Time UI Actions ---
    setSelectedBlockedTimeTypeId: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedBlockedTimeTypeId = action.payload;
    },
    setSelectedBlockedTimeEntryId: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedBlockedTimeEntryId = action.payload;
    },
    openEditBlockedTimeTypeModal: (state, action: PayloadAction<string>) => {
      state.ui.selectedBlockedTimeTypeId = action.payload;
      state.ui.activeModal = 'editBlockedTimeType';
    },
    openBlockTimeModal: (state, action: PayloadAction<{
      staffId?: string;
      date?: string;
      startTime?: string;
    } | undefined>) => {
      state.ui.blockTimeModalOpen = true;
      state.ui.blockTimeModalContext = action.payload ? {
        staffId: action.payload.staffId ?? null,
        date: action.payload.date ?? null,
        startTime: action.payload.startTime ?? null,
      } : null;
    },
    closeBlockTimeModal: (state) => {
      state.ui.blockTimeModalOpen = false;
      state.ui.blockTimeModalContext = null;
    },
    openEditBlockedTimeEntryModal: (state, action: PayloadAction<string>) => {
      state.ui.selectedBlockedTimeEntryId = action.payload;
      state.ui.activeModal = 'editBlockedTimeEntry';
    },

    // --- Closed Period UI Actions ---
    setSelectedClosedPeriodId: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedClosedPeriodId = action.payload;
    },
    openCreateClosedPeriodModal: (state) => {
      state.ui.activeModal = 'createClosedPeriod';
    },
    openEditClosedPeriodModal: (state, action: PayloadAction<string>) => {
      state.ui.selectedClosedPeriodId = action.payload;
      state.ui.activeModal = 'editClosedPeriod';
    },

    // --- Blocked Time Filter Actions ---
    setBlockedTimeFilters: (state, action: PayloadAction<Partial<BlockedTimeFilters>>) => {
      state.blockedTimeEntries.filters = {
        ...state.blockedTimeEntries.filters,
        ...action.payload,
      };
    },
    resetBlockedTimeFilters: (state) => {
      state.blockedTimeEntries.filters = initialState.blockedTimeEntries.filters;
    },

    // --- Error Actions ---
    clearScheduleError: (state) => {
      state.timeOffTypes.error = null;
      state.timeOffRequests.error = null;
      state.blockedTimeTypes.error = null;
      state.blockedTimeEntries.error = null;
    },
    clearTimeOffTypesError: (state) => {
      state.timeOffTypes.error = null;
    },
    clearTimeOffRequestsError: (state) => {
      state.timeOffRequests.error = null;
    },
    clearBlockedTimeTypesError: (state) => {
      state.blockedTimeTypes.error = null;
    },
    clearBlockedTimeEntriesError: (state) => {
      state.blockedTimeEntries.error = null;
    },
    clearClosedPeriodsError: (state) => {
      state.closedPeriods.error = null;
    },

    // --- Direct Data Setters (for live query sync) ---
    setTimeOffTypes: (state, action: PayloadAction<TimeOffType[]>) => {
      state.timeOffTypes.items = action.payload;
    },
    setTimeOffRequests: (state, action: PayloadAction<TimeOffRequest[]>) => {
      state.timeOffRequests.items = action.payload;
    },
    setPendingCount: (state, action: PayloadAction<number>) => {
      state.timeOffRequests.pendingCount = action.payload;
    },
    setBlockedTimeTypes: (state, action: PayloadAction<BlockedTimeType[]>) => {
      state.blockedTimeTypes.items = action.payload;
    },
    setBlockedTimeEntries: (state, action: PayloadAction<BlockedTimeEntry[]>) => {
      state.blockedTimeEntries.items = action.payload;
    },
    setClosedPeriods: (state, action: PayloadAction<BusinessClosedPeriod[]>) => {
      state.closedPeriods.items = action.payload;
    },

    // --- Optimistic Update Helpers ---
    addTimeOffTypeOptimistic: (state, action: PayloadAction<TimeOffType>) => {
      state.timeOffTypes.items.push(action.payload);
    },
    removeTimeOffTypeOptimistic: (state, action: PayloadAction<string>) => {
      state.timeOffTypes.items = state.timeOffTypes.items.filter(t => t.id !== action.payload);
    },
    updateTimeOffTypeOptimistic: (state, action: PayloadAction<TimeOffType>) => {
      const index = state.timeOffTypes.items.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.timeOffTypes.items[index] = action.payload;
      }
    },
    addTimeOffRequestOptimistic: (state, action: PayloadAction<TimeOffRequest>) => {
      state.timeOffRequests.items.push(action.payload);
      if (action.payload.status === 'pending') {
        state.timeOffRequests.pendingCount += 1;
      }
    },
    removeTimeOffRequestOptimistic: (state, action: PayloadAction<string>) => {
      const request = state.timeOffRequests.items.find(r => r.id === action.payload);
      if (request?.status === 'pending') {
        state.timeOffRequests.pendingCount -= 1;
      }
      state.timeOffRequests.items = state.timeOffRequests.items.filter(r => r.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // --- Time-Off Types ---
    builder
      .addCase(fetchTimeOffTypes.pending, (state) => {
        state.timeOffTypes.loading = true;
        state.timeOffTypes.error = null;
      })
      .addCase(fetchTimeOffTypes.fulfilled, (state, action) => {
        state.timeOffTypes.loading = false;
        state.timeOffTypes.items = action.payload;
        state.timeOffTypes.lastFetched = new Date().toISOString();
      })
      .addCase(fetchTimeOffTypes.rejected, (state, action) => {
        state.timeOffTypes.loading = false;
        state.timeOffTypes.error = action.payload as string;
      })

      .addCase(fetchAllTimeOffTypes.pending, (state) => {
        state.timeOffTypes.loading = true;
        state.timeOffTypes.error = null;
      })
      .addCase(fetchAllTimeOffTypes.fulfilled, (state, action) => {
        state.timeOffTypes.loading = false;
        state.timeOffTypes.items = action.payload;
        state.timeOffTypes.lastFetched = new Date().toISOString();
      })
      .addCase(fetchAllTimeOffTypes.rejected, (state, action) => {
        state.timeOffTypes.loading = false;
        state.timeOffTypes.error = action.payload as string;
      })

      .addCase(createTimeOffType.pending, (state) => {
        state.timeOffTypes.loading = true;
        state.timeOffTypes.error = null;
      })
      .addCase(createTimeOffType.fulfilled, (state, action) => {
        state.timeOffTypes.loading = false;
        state.timeOffTypes.items.push(action.payload);
      })
      .addCase(createTimeOffType.rejected, (state, action) => {
        state.timeOffTypes.loading = false;
        state.timeOffTypes.error = typeof action.payload === 'string'
          ? action.payload
          : (action.payload as { message: string })?.message || 'Create failed';
      })

      .addCase(updateTimeOffType.fulfilled, (state, action) => {
        const index = state.timeOffTypes.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.timeOffTypes.items[index] = action.payload;
        }
      })
      .addCase(updateTimeOffType.rejected, (state, action) => {
        state.timeOffTypes.error = typeof action.payload === 'string'
          ? action.payload
          : (action.payload as { message: string })?.message || 'Update failed';
      })

      .addCase(deleteTimeOffType.fulfilled, (state, action) => {
        state.timeOffTypes.items = state.timeOffTypes.items.filter(t => t.id !== action.payload);
      })
      .addCase(deleteTimeOffType.rejected, (state, action) => {
        state.timeOffTypes.error = typeof action.payload === 'string'
          ? action.payload
          : (action.payload as { message: string })?.message || 'Delete failed';
      })

      .addCase(seedTimeOffTypes.fulfilled, (state, action) => {
        state.timeOffTypes.items = [...state.timeOffTypes.items, ...action.payload];
      });

    // --- Time-Off Requests ---
    builder
      .addCase(fetchTimeOffRequests.pending, (state) => {
        state.timeOffRequests.loading = true;
        state.timeOffRequests.error = null;
      })
      .addCase(fetchTimeOffRequests.fulfilled, (state, action) => {
        state.timeOffRequests.loading = false;
        state.timeOffRequests.items = action.payload;
        state.timeOffRequests.lastFetched = new Date().toISOString();
      })
      .addCase(fetchTimeOffRequests.rejected, (state, action) => {
        state.timeOffRequests.loading = false;
        state.timeOffRequests.error = action.payload as string;
      })

      .addCase(fetchPendingCount.fulfilled, (state, action) => {
        state.timeOffRequests.pendingCount = action.payload;
      })

      .addCase(createTimeOffRequest.pending, (state) => {
        state.timeOffRequests.loading = true;
        state.timeOffRequests.error = null;
      })
      .addCase(createTimeOffRequest.fulfilled, (state, action) => {
        state.timeOffRequests.loading = false;
        state.timeOffRequests.items.push(action.payload);
        if (action.payload.status === 'pending') {
          state.timeOffRequests.pendingCount += 1;
        }
      })
      .addCase(createTimeOffRequest.rejected, (state, action) => {
        state.timeOffRequests.loading = false;
        state.timeOffRequests.error = typeof action.payload === 'string'
          ? action.payload
          : (action.payload as { message: string })?.message || 'Create failed';
      })

      .addCase(approveTimeOffRequest.fulfilled, (state, action) => {
        const index = state.timeOffRequests.items.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          const wasPending = state.timeOffRequests.items[index].status === 'pending';
          state.timeOffRequests.items[index] = action.payload;
          if (wasPending) {
            state.timeOffRequests.pendingCount = Math.max(0, state.timeOffRequests.pendingCount - 1);
          }
        }
      })

      .addCase(denyTimeOffRequest.fulfilled, (state, action) => {
        const index = state.timeOffRequests.items.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          const wasPending = state.timeOffRequests.items[index].status === 'pending';
          state.timeOffRequests.items[index] = action.payload;
          if (wasPending) {
            state.timeOffRequests.pendingCount = Math.max(0, state.timeOffRequests.pendingCount - 1);
          }
        }
      })

      .addCase(cancelTimeOffRequest.fulfilled, (state, action) => {
        const index = state.timeOffRequests.items.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          const wasPending = state.timeOffRequests.items[index].status === 'pending';
          state.timeOffRequests.items[index] = action.payload;
          if (wasPending) {
            state.timeOffRequests.pendingCount = Math.max(0, state.timeOffRequests.pendingCount - 1);
          }
        }
      });

    // --- Blocked Time Types ---
    builder
      .addCase(fetchBlockedTimeTypes.pending, (state) => {
        state.blockedTimeTypes.loading = true;
        state.blockedTimeTypes.error = null;
      })
      .addCase(fetchBlockedTimeTypes.fulfilled, (state, action) => {
        state.blockedTimeTypes.loading = false;
        state.blockedTimeTypes.items = action.payload;
        state.blockedTimeTypes.lastFetched = new Date().toISOString();
      })
      .addCase(fetchBlockedTimeTypes.rejected, (state, action) => {
        state.blockedTimeTypes.loading = false;
        state.blockedTimeTypes.error = action.payload as string;
      })

      .addCase(fetchAllBlockedTimeTypes.pending, (state) => {
        state.blockedTimeTypes.loading = true;
        state.blockedTimeTypes.error = null;
      })
      .addCase(fetchAllBlockedTimeTypes.fulfilled, (state, action) => {
        state.blockedTimeTypes.loading = false;
        state.blockedTimeTypes.items = action.payload;
        state.blockedTimeTypes.lastFetched = new Date().toISOString();
      })
      .addCase(fetchAllBlockedTimeTypes.rejected, (state, action) => {
        state.blockedTimeTypes.loading = false;
        state.blockedTimeTypes.error = action.payload as string;
      })

      .addCase(createBlockedTimeType.pending, (state) => {
        state.blockedTimeTypes.loading = true;
        state.blockedTimeTypes.error = null;
      })
      .addCase(createBlockedTimeType.fulfilled, (state, action) => {
        state.blockedTimeTypes.loading = false;
        state.blockedTimeTypes.items.push(action.payload);
      })
      .addCase(createBlockedTimeType.rejected, (state, action) => {
        state.blockedTimeTypes.loading = false;
        state.blockedTimeTypes.error = typeof action.payload === 'string'
          ? action.payload
          : (action.payload as { message: string })?.message || 'Create failed';
      })

      .addCase(updateBlockedTimeType.fulfilled, (state, action) => {
        const index = state.blockedTimeTypes.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.blockedTimeTypes.items[index] = action.payload;
        }
      })
      .addCase(updateBlockedTimeType.rejected, (state, action) => {
        state.blockedTimeTypes.error = typeof action.payload === 'string'
          ? action.payload
          : (action.payload as { message: string })?.message || 'Update failed';
      })

      .addCase(deleteBlockedTimeType.fulfilled, (state, action) => {
        state.blockedTimeTypes.items = state.blockedTimeTypes.items.filter(t => t.id !== action.payload);
      })
      .addCase(deleteBlockedTimeType.rejected, (state, action) => {
        state.blockedTimeTypes.error = typeof action.payload === 'string'
          ? action.payload
          : (action.payload as { message: string })?.message || 'Delete failed';
      })

      .addCase(seedBlockedTimeTypes.fulfilled, (state, action) => {
        state.blockedTimeTypes.items = [...state.blockedTimeTypes.items, ...action.payload];
      });

    // --- Blocked Time Entries ---
    builder
      .addCase(fetchBlockedTimeEntries.pending, (state) => {
        state.blockedTimeEntries.loading = true;
        state.blockedTimeEntries.error = null;
      })
      .addCase(fetchBlockedTimeEntries.fulfilled, (state, action) => {
        state.blockedTimeEntries.loading = false;
        state.blockedTimeEntries.items = action.payload;
        state.blockedTimeEntries.lastFetched = new Date().toISOString();
      })
      .addCase(fetchBlockedTimeEntries.rejected, (state, action) => {
        state.blockedTimeEntries.loading = false;
        state.blockedTimeEntries.error = action.payload as string;
      })

      .addCase(createBlockedTimeEntry.pending, (state) => {
        state.blockedTimeEntries.loading = true;
        state.blockedTimeEntries.error = null;
      })
      .addCase(createBlockedTimeEntry.fulfilled, (state, action) => {
        state.blockedTimeEntries.loading = false;
        state.blockedTimeEntries.items.push(action.payload);
      })
      .addCase(createBlockedTimeEntry.rejected, (state, action) => {
        state.blockedTimeEntries.loading = false;
        state.blockedTimeEntries.error = typeof action.payload === 'string'
          ? action.payload
          : (action.payload as { message: string })?.message || 'Create failed';
      })

      .addCase(deleteBlockedTimeEntry.fulfilled, (state, action) => {
        state.blockedTimeEntries.items = state.blockedTimeEntries.items.filter(e => e.id !== action.payload);
      })
      .addCase(deleteBlockedTimeEntry.rejected, (state, action) => {
        state.blockedTimeEntries.error = typeof action.payload === 'string'
          ? action.payload
          : 'Delete failed';
      })

      .addCase(deleteBlockedTimeSeries.fulfilled, (state, action) => {
        state.blockedTimeEntries.items = state.blockedTimeEntries.items.filter(
          e => e.seriesId !== action.payload.seriesId
        );
      });

    // --- Business Closed Periods ---
    builder
      .addCase(fetchClosedPeriods.pending, (state) => {
        state.closedPeriods.loading = true;
        state.closedPeriods.error = null;
      })
      .addCase(fetchClosedPeriods.fulfilled, (state, action) => {
        state.closedPeriods.loading = false;
        state.closedPeriods.items = action.payload;
        state.closedPeriods.lastFetched = new Date().toISOString();
      })
      .addCase(fetchClosedPeriods.rejected, (state, action) => {
        state.closedPeriods.loading = false;
        state.closedPeriods.error = action.payload as string;
      })

      .addCase(createClosedPeriod.pending, (state) => {
        state.closedPeriods.loading = true;
        state.closedPeriods.error = null;
      })
      .addCase(createClosedPeriod.fulfilled, (state, action) => {
        state.closedPeriods.loading = false;
        state.closedPeriods.items.push(action.payload);
      })
      .addCase(createClosedPeriod.rejected, (state, action) => {
        state.closedPeriods.loading = false;
        state.closedPeriods.error = action.payload as string;
      })

      .addCase(updateClosedPeriod.fulfilled, (state, action) => {
        const index = state.closedPeriods.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.closedPeriods.items[index] = action.payload;
        }
      })
      .addCase(updateClosedPeriod.rejected, (state, action) => {
        state.closedPeriods.error = action.payload as string;
      })

      .addCase(deleteClosedPeriod.fulfilled, (state, action) => {
        state.closedPeriods.items = state.closedPeriods.items.filter(p => p.id !== action.payload);
      })
      .addCase(deleteClosedPeriod.rejected, (state, action) => {
        state.closedPeriods.error = action.payload as string;
      });
  },
});

// ==================== EXPORTS ====================

export const {
  // Time-Off Filters
  setTimeOffRequestFilters,
  resetTimeOffRequestFilters,
  // Time-Off UI
  setActiveModal,
  closeModal,
  setSelectedTimeOffTypeId,
  setSelectedRequestId,
  openEditTimeOffTypeModal,
  openApproveRequestModal,
  openDenyRequestModal,
  // Blocked Time UI
  setSelectedBlockedTimeTypeId,
  setSelectedBlockedTimeEntryId,
  openEditBlockedTimeTypeModal,
  openBlockTimeModal,
  closeBlockTimeModal,
  openEditBlockedTimeEntryModal,
  // Closed Periods UI
  setSelectedClosedPeriodId,
  openCreateClosedPeriodModal,
  openEditClosedPeriodModal,
  // Blocked Time Filters
  setBlockedTimeFilters,
  resetBlockedTimeFilters,
  // Errors
  clearScheduleError,
  clearTimeOffTypesError,
  clearTimeOffRequestsError,
  clearBlockedTimeTypesError,
  clearBlockedTimeEntriesError,
  clearClosedPeriodsError,
  // Data setters
  setTimeOffTypes,
  setTimeOffRequests,
  setPendingCount,
  setBlockedTimeTypes,
  setBlockedTimeEntries,
  setClosedPeriods,
  // Optimistic updates
  addTimeOffTypeOptimistic,
  removeTimeOffTypeOptimistic,
  updateTimeOffTypeOptimistic,
  addTimeOffRequestOptimistic,
  removeTimeOffRequestOptimistic,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;
