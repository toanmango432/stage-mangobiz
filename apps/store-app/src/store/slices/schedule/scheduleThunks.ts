/**
 * Schedule Slice Async Thunks
 *
 * Extracted from scheduleSlice.ts to reduce file size.
 * Contains all async operations for time-off, blocked time, and closed periods.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../index';
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
} from '../../../types/schedule';
import {
  timeOffTypesDB,
  timeOffRequestsDB,
  blockedTimeTypesDB,
  blockedTimeEntriesDB,
  businessClosedPeriodsDB,
} from '../../../db/scheduleDatabase';
import {
  ScheduleError,
  TimeOffTypeNotFoundError,
  CannotDeleteSystemDefaultError,
  BlockedTimeTypeNotFoundError,
  CannotDeleteDefaultBlockedTimeTypeError,
} from '../../../types/schedule/errors';

// ==================== HELPER FUNCTIONS ====================

function calculatePartialDayHours(startTime?: string | null, endTime?: string | null): number {
  if (!startTime || !endTime) return 8;

  const [startHours, startMins] = startTime.split(':').map(Number);
  const [endHours, endMins] = endTime.split(':').map(Number);

  const startMinutes = startHours * 60 + startMins;
  const endMinutes = endHours * 60 + endMins;

  return Math.max(0, (endMinutes - startMinutes) / 60);
}

// ==================== TIME-OFF TYPES THUNKS ====================

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
      const type = state.schedule.timeOffTypes.items.find((t) => t.id === id);
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

// ==================== TIME-OFF REQUESTS THUNKS ====================

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
      const type = state.schedule.timeOffTypes.items.find((t) => t.id === input.typeId);
      if (!type) {
        throw new TimeOffTypeNotFoundError(input.typeId);
      }

      // Calculate hours (simplified - assumes 8 hours per day)
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      const totalDays =
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const totalHours = input.isAllDay
        ? totalDays * 8
        : calculatePartialDayHours(input.startTime, input.endTime);

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
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to deny request');
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
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to cancel request');
    }
  }
);

// ==================== BLOCKED TIME TYPES THUNKS ====================

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
      const type = state.schedule.blockedTimeTypes.items.find((t) => t.id === id);
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

// ==================== BLOCKED TIME ENTRIES THUNKS ====================

export interface BlockedTimeFilters {
  staffId: string | null;
  typeId: string | null;
  startDate: string | null;
  endDate: string | null;
}

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
      const type = state.schedule.blockedTimeTypes.items.find((t) => t.id === input.typeId);
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

// ==================== BUSINESS CLOSED PERIODS THUNKS ====================

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
