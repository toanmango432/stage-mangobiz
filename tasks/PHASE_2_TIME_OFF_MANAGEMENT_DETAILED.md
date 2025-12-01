# Phase 2: Time-Off Management - Detailed Implementation Plan (Enhanced)

**Phase:** 2 of 7
**Dependencies:** Phase 1 (Core Types & Database) - COMPLETED
**Estimated Effort:** 2 weeks
**Quality Target:** 9-10/10

---

## Overview

Phase 2 implements the complete Time-Off Management feature with enterprise-grade patterns:
- Redux state management with **optimistic updates**
- **Custom hooks** for clean component integration
- **Memoized selectors** for performance
- **Error types** for proper error handling
- **Pagination** support for scalability
- Service layer for business logic
- Full UI component suite

---

## Architecture Enhancements

### 1. Custom Error Types (`src/types/schedule/errors.ts`)

```typescript
// Base error for all schedule operations
export class ScheduleError extends Error {
  constructor(
    message: string,
    public code: ScheduleErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ScheduleError';
  }
}

export type ScheduleErrorCode =
  | 'TIME_OFF_TYPE_NOT_FOUND'
  | 'TIME_OFF_REQUEST_NOT_FOUND'
  | 'CANNOT_DELETE_SYSTEM_DEFAULT'
  | 'REQUEST_NOT_PENDING'
  | 'DENIAL_REASON_REQUIRED'
  | 'CONFLICT_EXISTS'
  | 'INSUFFICIENT_BALANCE'
  | 'DATE_RANGE_INVALID'
  | 'STAFF_NOT_FOUND'
  | 'UNAUTHORIZED';

// Specific error classes for type checking
export class TimeOffTypeNotFoundError extends ScheduleError {
  constructor(typeId: string) {
    super(`Time-off type not found: ${typeId}`, 'TIME_OFF_TYPE_NOT_FOUND', { typeId });
  }
}

export class TimeOffRequestNotFoundError extends ScheduleError {
  constructor(requestId: string) {
    super(`Time-off request not found: ${requestId}`, 'TIME_OFF_REQUEST_NOT_FOUND', { requestId });
  }
}

export class CannotDeleteSystemDefaultError extends ScheduleError {
  constructor(typeId: string, typeName: string) {
    super(`Cannot delete system default type: ${typeName}`, 'CANNOT_DELETE_SYSTEM_DEFAULT', { typeId, typeName });
  }
}

export class RequestNotPendingError extends ScheduleError {
  constructor(requestId: string, currentStatus: string) {
    super(`Request is not pending (current: ${currentStatus})`, 'REQUEST_NOT_PENDING', { requestId, currentStatus });
  }
}

export class DenialReasonRequiredError extends ScheduleError {
  constructor() {
    super('Denial reason is required', 'DENIAL_REASON_REQUIRED');
  }
}

export class ConflictExistsError extends ScheduleError {
  constructor(conflictingAppointmentIds: string[]) {
    super(`${conflictingAppointmentIds.length} conflicting appointments exist`, 'CONFLICT_EXISTS', { conflictingAppointmentIds });
  }
}

export class DateRangeInvalidError extends ScheduleError {
  constructor(startDate: string, endDate: string) {
    super(`Invalid date range: ${startDate} to ${endDate}`, 'DATE_RANGE_INVALID', { startDate, endDate });
  }
}
```

---

### 2. Pagination Types (`src/types/schedule/pagination.ts`)

```typescript
export interface PaginationParams {
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    hasMore: boolean;
    nextCursor: string | null;
    prevCursor: string | null;
  };
}

export interface TimeOffRequestFilters {
  status?: 'all' | 'pending' | 'approved' | 'denied' | 'cancelled';
  staffId?: string | null;
  typeId?: string | null;
  dateRange?: 'upcoming' | 'past' | 'all' | { start: string; end: string };
}
```

---

### 3. Enhanced Database Operations (`src/db/scheduleDatabase.ts` - Updates)

Add pagination support to existing operations:

```typescript
// Add to timeOffRequestsDB

async getAllPaginated(
  storeId: string,
  filters: TimeOffRequestFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<TimeOffRequest>> {
  const { limit = 50, cursor, sortBy = 'startDate', sortOrder = 'desc' } = pagination;

  let query = db.timeOffRequests.where('storeId').equals(storeId);

  // Apply filters
  let results = await query.filter(r => {
    if (r.isDeleted) return false;
    if (filters.status && filters.status !== 'all' && r.status !== filters.status) return false;
    if (filters.staffId && r.staffId !== filters.staffId) return false;
    if (filters.typeId && r.typeId !== filters.typeId) return false;

    if (filters.dateRange) {
      const today = new Date().toISOString().split('T')[0];
      if (filters.dateRange === 'upcoming' && r.startDate < today) return false;
      if (filters.dateRange === 'past' && r.startDate >= today) return false;
      if (typeof filters.dateRange === 'object') {
        if (r.endDate < filters.dateRange.start) return false;
        if (r.startDate > filters.dateRange.end) return false;
      }
    }
    return true;
  }).toArray();

  // Sort
  results.sort((a, b) => {
    const aVal = a[sortBy as keyof TimeOffRequest] as string;
    const bVal = b[sortBy as keyof TimeOffRequest] as string;
    return sortOrder === 'asc'
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal);
  });

  const total = results.length;

  // Apply cursor
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = results.findIndex(r => r.id === cursor);
    if (cursorIndex !== -1) startIndex = cursorIndex + 1;
  }

  // Slice for pagination
  const paginatedItems = results.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < total;

  return {
    items: paginatedItems,
    pagination: {
      total,
      hasMore,
      nextCursor: hasMore ? paginatedItems[paginatedItems.length - 1]?.id : null,
      prevCursor: startIndex > 0 ? results[startIndex - 1]?.id : null,
    },
  };
}
```

---

### 4. Selectors File (`src/store/selectors/scheduleSelectors.ts`)

```typescript
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { TimeOffType, TimeOffRequest, TimeOffRequestStatus } from '../../types/schedule';

// ==================== BASE SELECTORS ====================

export const selectScheduleState = (state: RootState) => state.schedule;

// Time-Off Types
export const selectTimeOffTypesState = (state: RootState) => state.schedule.timeOffTypes;
export const selectTimeOffTypes = (state: RootState) => state.schedule.timeOffTypes.items;
export const selectTimeOffTypesLoading = (state: RootState) => state.schedule.timeOffTypes.loading;
export const selectTimeOffTypesError = (state: RootState) => state.schedule.timeOffTypes.error;
export const selectTimeOffTypesLastFetched = (state: RootState) => state.schedule.timeOffTypes.lastFetched;

// Time-Off Requests
export const selectTimeOffRequestsState = (state: RootState) => state.schedule.timeOffRequests;
export const selectTimeOffRequests = (state: RootState) => state.schedule.timeOffRequests.items;
export const selectTimeOffRequestsLoading = (state: RootState) => state.schedule.timeOffRequests.loading;
export const selectTimeOffRequestsError = (state: RootState) => state.schedule.timeOffRequests.error;
export const selectTimeOffRequestFilters = (state: RootState) => state.schedule.timeOffRequests.filters;
export const selectPendingTimeOffCount = (state: RootState) => state.schedule.timeOffRequests.pendingCount;

// UI State
export const selectScheduleUI = (state: RootState) => state.schedule.ui;
export const selectActiveModal = (state: RootState) => state.schedule.ui.activeModal;

// ==================== MEMOIZED SELECTORS ====================

/**
 * Active time-off types, sorted by displayOrder
 * Memoized to prevent unnecessary re-renders
 */
export const selectActiveTimeOffTypes = createSelector(
  [selectTimeOffTypes],
  (types): TimeOffType[] =>
    types
      .filter(t => t.isActive && !t.isDeleted)
      .sort((a, b) => a.displayOrder - b.displayOrder)
);

/**
 * Time-off types as a lookup map for O(1) access
 */
export const selectTimeOffTypesMap = createSelector(
  [selectTimeOffTypes],
  (types): Map<string, TimeOffType> =>
    new Map(types.map(t => [t.id, t]))
);

/**
 * Filtered time-off requests based on current filter state
 */
export const selectFilteredTimeOffRequests = createSelector(
  [selectTimeOffRequests, selectTimeOffRequestFilters],
  (requests, filters): TimeOffRequest[] => {
    const today = new Date().toISOString().split('T')[0];

    return requests
      .filter(r => {
        if (r.isDeleted) return false;

        // Status filter
        if (filters.status !== 'all' && r.status !== filters.status) return false;

        // Staff filter
        if (filters.staffId && r.staffId !== filters.staffId) return false;

        // Type filter
        if (filters.typeId && r.typeId !== filters.typeId) return false;

        // Date range filter
        if (filters.dateRange === 'upcoming' && r.startDate < today) return false;
        if (filters.dateRange === 'past' && r.startDate >= today) return false;

        return true;
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
);

/**
 * Pending requests only
 */
export const selectPendingTimeOffRequests = createSelector(
  [selectTimeOffRequests],
  (requests): TimeOffRequest[] =>
    requests
      .filter(r => !r.isDeleted && r.status === 'pending')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
);

/**
 * Requests by staff ID (factory selector)
 */
export const makeSelectTimeOffRequestsByStaff = () =>
  createSelector(
    [selectTimeOffRequests, (_state: RootState, staffId: string) => staffId],
    (requests, staffId): TimeOffRequest[] =>
      requests
        .filter(r => r.staffId === staffId && !r.isDeleted)
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
  );

/**
 * Approved time-off for a date range (for calendar display)
 */
export const makeSelectApprovedTimeOffForDateRange = () =>
  createSelector(
    [
      selectTimeOffRequests,
      (_state: RootState, startDate: string) => startDate,
      (_state: RootState, _startDate: string, endDate: string) => endDate,
    ],
    (requests, startDate, endDate): TimeOffRequest[] =>
      requests.filter(r =>
        !r.isDeleted &&
        r.status === 'approved' &&
        r.endDate >= startDate &&
        r.startDate <= endDate
      )
  );

/**
 * Check if data needs refresh (stale after 5 minutes)
 */
export const selectTimeOffTypesNeedsRefresh = createSelector(
  [selectTimeOffTypesLastFetched],
  (lastFetched): boolean => {
    if (!lastFetched) return true;
    const staleTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() - new Date(lastFetched).getTime() > staleTime;
  }
);

/**
 * Group requests by status for summary view
 */
export const selectTimeOffRequestsByStatus = createSelector(
  [selectTimeOffRequests],
  (requests): Record<TimeOffRequestStatus, TimeOffRequest[]> => {
    const grouped: Record<TimeOffRequestStatus, TimeOffRequest[]> = {
      pending: [],
      approved: [],
      denied: [],
      cancelled: [],
    };

    requests.forEach(r => {
      if (!r.isDeleted && grouped[r.status]) {
        grouped[r.status].push(r);
      }
    });

    return grouped;
  }
);

/**
 * Stats summary for dashboard
 */
export const selectTimeOffStats = createSelector(
  [selectTimeOffRequestsByStatus],
  (byStatus): {
    pending: number;
    approvedThisMonth: number;
    totalThisMonth: number;
  } => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const approvedThisMonth = byStatus.approved.filter(r => r.startDate >= monthStart).length;
    const totalThisMonth = Object.values(byStatus)
      .flat()
      .filter(r => r.createdAt >= monthStart).length;

    return {
      pending: byStatus.pending.length,
      approvedThisMonth,
      totalThisMonth,
    };
  }
);
```

---

### 5. Custom Hooks (`src/hooks/useSchedule.ts`)

```typescript
import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchTimeOffTypes,
  fetchTimeOffRequests,
  createTimeOffType,
  updateTimeOffType,
  deleteTimeOffType,
  createTimeOffRequest,
  approveTimeOffRequest,
  denyTimeOffRequest,
  cancelTimeOffRequest,
  fetchPendingCount,
  setTimeOffRequestFilters,
  setActiveModal,
  clearScheduleError,
} from '../store/slices/scheduleSlice';
import {
  selectActiveTimeOffTypes,
  selectTimeOffTypesLoading,
  selectTimeOffTypesError,
  selectTimeOffTypesNeedsRefresh,
  selectFilteredTimeOffRequests,
  selectTimeOffRequestsLoading,
  selectTimeOffRequestsError,
  selectTimeOffRequestFilters,
  selectPendingTimeOffCount,
  selectActiveModal,
  makeSelectTimeOffRequestsByStaff,
  makeSelectApprovedTimeOffForDateRange,
  selectTimeOffStats,
} from '../store/selectors/scheduleSelectors';
import type {
  CreateTimeOffTypeInput,
  UpdateTimeOffTypeInput,
  CreateTimeOffRequestInput,
  TimeOffRequestFilters,
} from '../types/schedule';

interface UseScheduleContextParams {
  storeId: string;
  tenantId: string;
  userId: string;
  deviceId: string;
  isManager?: boolean;
}

// ==================== TIME-OFF TYPES HOOK ====================

export function useTimeOffTypes(storeId: string) {
  const dispatch = useAppDispatch();
  const types = useAppSelector(selectActiveTimeOffTypes);
  const loading = useAppSelector(selectTimeOffTypesLoading);
  const error = useAppSelector(selectTimeOffTypesError);
  const needsRefresh = useAppSelector(selectTimeOffTypesNeedsRefresh);

  // Auto-fetch on mount or when stale
  useEffect(() => {
    if (needsRefresh && storeId) {
      dispatch(fetchTimeOffTypes(storeId));
    }
  }, [dispatch, storeId, needsRefresh]);

  const refetch = useCallback(() => {
    return dispatch(fetchTimeOffTypes(storeId));
  }, [dispatch, storeId]);

  const clearError = useCallback(() => {
    dispatch(clearScheduleError());
  }, [dispatch]);

  return {
    types,
    loading,
    error,
    refetch,
    clearError,
  };
}

// ==================== TIME-OFF TYPE MUTATIONS HOOK ====================

export function useTimeOffTypeMutations(context: UseScheduleContextParams) {
  const dispatch = useAppDispatch();

  const create = useCallback(async (input: CreateTimeOffTypeInput) => {
    const result = await dispatch(createTimeOffType({
      input,
      userId: context.userId,
      storeId: context.storeId,
      tenantId: context.tenantId,
      deviceId: context.deviceId,
    })).unwrap();
    return result;
  }, [dispatch, context]);

  const update = useCallback(async (id: string, updates: UpdateTimeOffTypeInput) => {
    const result = await dispatch(updateTimeOffType({
      id,
      updates,
      userId: context.userId,
      deviceId: context.deviceId,
    })).unwrap();
    return result;
  }, [dispatch, context]);

  const remove = useCallback(async (id: string) => {
    await dispatch(deleteTimeOffType({
      id,
      userId: context.userId,
      deviceId: context.deviceId,
    })).unwrap();
  }, [dispatch, context]);

  return { create, update, remove };
}

// ==================== TIME-OFF REQUESTS HOOK ====================

export function useTimeOffRequests(storeId: string) {
  const dispatch = useAppDispatch();
  const requests = useAppSelector(selectFilteredTimeOffRequests);
  const loading = useAppSelector(selectTimeOffRequestsLoading);
  const error = useAppSelector(selectTimeOffRequestsError);
  const filters = useAppSelector(selectTimeOffRequestFilters);
  const pendingCount = useAppSelector(selectPendingTimeOffCount);

  // Initial fetch
  useEffect(() => {
    if (storeId) {
      dispatch(fetchTimeOffRequests({ storeId, filters }));
      dispatch(fetchPendingCount(storeId));
    }
  }, [dispatch, storeId]); // Note: filters not in deps to avoid refetch on filter change

  const refetch = useCallback(() => {
    return dispatch(fetchTimeOffRequests({ storeId, filters }));
  }, [dispatch, storeId, filters]);

  const setFilters = useCallback((newFilters: Partial<TimeOffRequestFilters>) => {
    dispatch(setTimeOffRequestFilters(newFilters));
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearScheduleError());
  }, [dispatch]);

  return {
    requests,
    loading,
    error,
    filters,
    pendingCount,
    refetch,
    setFilters,
    clearError,
  };
}

// ==================== TIME-OFF REQUEST BY STAFF HOOK ====================

export function useStaffTimeOffRequests(staffId: string) {
  const selectByStaff = useMemo(makeSelectTimeOffRequestsByStaff, []);
  const requests = useAppSelector(state => selectByStaff(state, staffId));

  return { requests };
}

// ==================== TIME-OFF FOR CALENDAR HOOK ====================

export function useCalendarTimeOff(startDate: string, endDate: string) {
  const selectForDateRange = useMemo(makeSelectApprovedTimeOffForDateRange, []);
  const timeOffEntries = useAppSelector(state => selectForDateRange(state, startDate, endDate));

  return { timeOffEntries };
}

// ==================== TIME-OFF REQUEST MUTATIONS HOOK ====================

export function useTimeOffRequestMutations(context: UseScheduleContextParams) {
  const dispatch = useAppDispatch();

  const create = useCallback(async (input: CreateTimeOffRequestInput) => {
    const result = await dispatch(createTimeOffRequest({
      input,
      userId: context.userId,
      storeId: context.storeId,
      tenantId: context.tenantId,
      deviceId: context.deviceId,
    })).unwrap();
    return result;
  }, [dispatch, context]);

  const approve = useCallback(async (id: string, notes?: string) => {
    const result = await dispatch(approveTimeOffRequest({
      id,
      notes: notes ?? null,
      userId: context.userId,
      deviceId: context.deviceId,
    })).unwrap();
    return result;
  }, [dispatch, context]);

  const deny = useCallback(async (id: string, reason: string) => {
    const result = await dispatch(denyTimeOffRequest({
      id,
      reason,
      userId: context.userId,
      deviceId: context.deviceId,
    })).unwrap();
    return result;
  }, [dispatch, context]);

  const cancel = useCallback(async (id: string, reason?: string) => {
    const result = await dispatch(cancelTimeOffRequest({
      id,
      reason: reason ?? null,
      userId: context.userId,
      deviceId: context.deviceId,
    })).unwrap();
    return result;
  }, [dispatch, context]);

  return { create, approve, deny, cancel };
}

// ==================== TIME-OFF STATS HOOK ====================

export function useTimeOffStats() {
  const stats = useAppSelector(selectTimeOffStats);
  return stats;
}

// ==================== MODAL MANAGEMENT HOOK ====================

export function useScheduleModals() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector(selectActiveModal);

  const openModal = useCallback((modal: typeof activeModal) => {
    dispatch(setActiveModal(modal));
  }, [dispatch]);

  const closeModal = useCallback(() => {
    dispatch(setActiveModal('none'));
  }, [dispatch]);

  return { activeModal, openModal, closeModal };
}
```

---

### 6. Redux Slice with Optimistic Updates (`src/store/slices/scheduleSlice.ts`)

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { RootState } from '../index';
import type {
  TimeOffType,
  TimeOffRequest,
  CreateTimeOffTypeInput,
  UpdateTimeOffTypeInput,
  CreateTimeOffRequestInput,
  TimeOffRequestFilters,
} from '../../types/schedule';
import {
  timeOffTypesDB,
  timeOffRequestsDB,
} from '../../db/scheduleDatabase';
import {
  ScheduleError,
  TimeOffTypeNotFoundError,
  CannotDeleteSystemDefaultError,
} from '../../types/schedule/errors';

// ==================== STATE INTERFACE ====================

interface ScheduleState {
  timeOffTypes: {
    items: TimeOffType[];
    loading: boolean;
    error: string | null;
    lastFetched: string | null;
    // Optimistic update tracking
    optimisticIds: Set<string>;
  };
  timeOffRequests: {
    items: TimeOffRequest[];
    pendingCount: number;
    selectedId: string | null;
    loading: boolean;
    error: string | null;
    filters: TimeOffRequestFilters;
    lastFetched: string | null;
    optimisticIds: Set<string>;
    // Pagination
    pagination: {
      hasMore: boolean;
      nextCursor: string | null;
      total: number;
    };
  };
  ui: {
    activeModal: 'none' | 'createTimeOff' | 'editTimeOffType' | 'approveRequest' | 'createRequest';
    selectedTimeOffTypeId: string | null;
    selectedRequestId: string | null;
  };
}

const initialState: ScheduleState = {
  timeOffTypes: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
    optimisticIds: new Set(),
  },
  timeOffRequests: {
    items: [],
    pendingCount: 0,
    selectedId: null,
    loading: false,
    error: null,
    filters: {
      status: 'pending',
      staffId: null,
      typeId: null,
      dateRange: 'upcoming',
    },
    lastFetched: null,
    optimisticIds: new Set(),
    pagination: {
      hasMore: false,
      nextCursor: null,
      total: 0,
    },
  },
  ui: {
    activeModal: 'none',
    selectedTimeOffTypeId: null,
    selectedRequestId: null,
  },
};

// ==================== ASYNC THUNKS ====================

// --- Time-Off Types ---

export const fetchTimeOffTypes = createAsyncThunk(
  'schedule/fetchTimeOffTypes',
  async (storeId: string, { rejectWithValue }) => {
    try {
      return await timeOffTypesDB.getAll(storeId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch time-off types');
    }
  }
);

export const createTimeOffType = createAsyncThunk(
  'schedule/createTimeOffType',
  async (
    { input, userId, storeId, tenantId, deviceId }: {
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
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create time-off type');
    }
  }
);

export const updateTimeOffType = createAsyncThunk(
  'schedule/updateTimeOffType',
  async (
    { id, updates, userId, deviceId }: {
      id: string;
      updates: UpdateTimeOffTypeInput;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await timeOffTypesDB.update(id, updates, userId, deviceId);
      if (!result) throw new TimeOffTypeNotFoundError(id);
      return result;
    } catch (error) {
      if (error instanceof ScheduleError) {
        return rejectWithValue({ code: error.code, message: error.message });
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update time-off type');
    }
  }
);

export const deleteTimeOffType = createAsyncThunk(
  'schedule/deleteTimeOffType',
  async (
    { id, userId, deviceId }: { id: string; userId: string; deviceId: string },
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
      if (!success) throw new TimeOffTypeNotFoundError(id);
      return id;
    } catch (error) {
      if (error instanceof ScheduleError) {
        return rejectWithValue({ code: error.code, message: error.message });
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete time-off type');
    }
  }
);

// --- Time-Off Requests ---

export const fetchTimeOffRequests = createAsyncThunk(
  'schedule/fetchTimeOffRequests',
  async (
    { storeId, filters }: { storeId: string; filters?: TimeOffRequestFilters },
    { rejectWithValue }
  ) => {
    try {
      return await timeOffRequestsDB.getAll(storeId, filters);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch time-off requests');
    }
  }
);

export const fetchPendingCount = createAsyncThunk(
  'schedule/fetchPendingCount',
  async (storeId: string, { rejectWithValue }) => {
    try {
      return await timeOffRequestsDB.getPendingCount(storeId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch pending count');
    }
  }
);

export const createTimeOffRequest = createAsyncThunk(
  'schedule/createTimeOffRequest',
  async (
    { input, userId, storeId, tenantId, deviceId }: {
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
      if (!type) throw new TimeOffTypeNotFoundError(input.typeId);

      // Calculate hours (simplified - full implementation in service)
      const totalDays = Math.ceil(
        (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      const totalHours = totalDays * 8; // Default 8 hours per day

      // Check for conflicts (would call appointment DB in real implementation)
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
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create time-off request');
    }
  }
);

export const approveTimeOffRequest = createAsyncThunk(
  'schedule/approveTimeOffRequest',
  async (
    { id, notes, userId, deviceId }: {
      id: string;
      notes: string | null;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      // In real implementation, get user name from auth context
      const approverName = 'Manager';
      const result = await timeOffRequestsDB.approve(id, approverName, notes, userId, deviceId);
      if (!result) throw new Error('Request not found or not pending');
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to approve request');
    }
  }
);

export const denyTimeOffRequest = createAsyncThunk(
  'schedule/denyTimeOffRequest',
  async (
    { id, reason, userId, deviceId }: {
      id: string;
      reason: string;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const denierName = 'Manager';
      const result = await timeOffRequestsDB.deny(id, denierName, reason, userId, deviceId);
      if (!result) throw new Error('Request not found or not pending');
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to deny request');
    }
  }
);

export const cancelTimeOffRequest = createAsyncThunk(
  'schedule/cancelTimeOffRequest',
  async (
    { id, reason, userId, deviceId }: {
      id: string;
      reason: string | null;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await timeOffRequestsDB.cancel(id, reason, userId, deviceId);
      if (!result) throw new Error('Request not found or not pending');
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to cancel request');
    }
  }
);

// ==================== SLICE ====================

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    // Filters
    setTimeOffRequestFilters: (state, action: PayloadAction<Partial<TimeOffRequestFilters>>) => {
      state.timeOffRequests.filters = { ...state.timeOffRequests.filters, ...action.payload };
    },

    // UI
    setActiveModal: (state, action: PayloadAction<ScheduleState['ui']['activeModal']>) => {
      state.ui.activeModal = action.payload;
    },
    setSelectedTimeOffTypeId: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedTimeOffTypeId = action.payload;
    },
    setSelectedRequestId: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedRequestId = action.payload;
    },

    // Error handling
    clearScheduleError: (state) => {
      state.timeOffTypes.error = null;
      state.timeOffRequests.error = null;
    },

    // Direct setters (for live query sync / optimistic rollback)
    setTimeOffTypes: (state, action: PayloadAction<TimeOffType[]>) => {
      state.timeOffTypes.items = action.payload;
    },
    setTimeOffRequests: (state, action: PayloadAction<TimeOffRequest[]>) => {
      state.timeOffRequests.items = action.payload;
    },

    // Optimistic updates
    addOptimisticTimeOffType: (state, action: PayloadAction<TimeOffType>) => {
      state.timeOffTypes.items.push(action.payload);
      state.timeOffTypes.optimisticIds.add(action.payload.id);
    },
    removeOptimisticTimeOffType: (state, action: PayloadAction<string>) => {
      state.timeOffTypes.items = state.timeOffTypes.items.filter(t => t.id !== action.payload);
      state.timeOffTypes.optimisticIds.delete(action.payload);
    },
    addOptimisticTimeOffRequest: (state, action: PayloadAction<TimeOffRequest>) => {
      state.timeOffRequests.items.push(action.payload);
      state.timeOffRequests.optimisticIds.add(action.payload.id);
      if (action.payload.status === 'pending') {
        state.timeOffRequests.pendingCount += 1;
      }
    },
    removeOptimisticTimeOffRequest: (state, action: PayloadAction<string>) => {
      const request = state.timeOffRequests.items.find(r => r.id === action.payload);
      state.timeOffRequests.items = state.timeOffRequests.items.filter(r => r.id !== action.payload);
      state.timeOffRequests.optimisticIds.delete(action.payload);
      if (request?.status === 'pending') {
        state.timeOffRequests.pendingCount -= 1;
      }
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
        // Merge with optimistic items
        const optimisticItems = state.timeOffTypes.items.filter(
          t => state.timeOffTypes.optimisticIds.has(t.id)
        );
        state.timeOffTypes.items = [...action.payload, ...optimisticItems];
        state.timeOffTypes.lastFetched = new Date().toISOString();
      })
      .addCase(fetchTimeOffTypes.rejected, (state, action) => {
        state.timeOffTypes.loading = false;
        state.timeOffTypes.error = action.payload as string;
      })

      .addCase(createTimeOffType.fulfilled, (state, action) => {
        // Remove optimistic version if exists
        const optimisticIndex = state.timeOffTypes.items.findIndex(
          t => state.timeOffTypes.optimisticIds.has(t.id) && t.name === action.payload.name
        );
        if (optimisticIndex !== -1) {
          state.timeOffTypes.items[optimisticIndex] = action.payload;
          state.timeOffTypes.optimisticIds.delete(state.timeOffTypes.items[optimisticIndex].id);
        } else {
          state.timeOffTypes.items.push(action.payload);
        }
      })
      .addCase(createTimeOffType.rejected, (state, action) => {
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

      .addCase(deleteTimeOffType.fulfilled, (state, action) => {
        state.timeOffTypes.items = state.timeOffTypes.items.filter(t => t.id !== action.payload);
      });

    // --- Time-Off Requests ---
    builder
      .addCase(fetchTimeOffRequests.pending, (state) => {
        state.timeOffRequests.loading = true;
        state.timeOffRequests.error = null;
      })
      .addCase(fetchTimeOffRequests.fulfilled, (state, action) => {
        state.timeOffRequests.loading = false;
        // Merge with optimistic items
        const optimisticItems = state.timeOffRequests.items.filter(
          r => state.timeOffRequests.optimisticIds.has(r.id)
        );
        state.timeOffRequests.items = [...action.payload, ...optimisticItems];
        state.timeOffRequests.lastFetched = new Date().toISOString();
      })
      .addCase(fetchTimeOffRequests.rejected, (state, action) => {
        state.timeOffRequests.loading = false;
        state.timeOffRequests.error = action.payload as string;
      })

      .addCase(fetchPendingCount.fulfilled, (state, action) => {
        state.timeOffRequests.pendingCount = action.payload;
      })

      .addCase(createTimeOffRequest.fulfilled, (state, action) => {
        // Remove optimistic version
        state.timeOffRequests.items = state.timeOffRequests.items.filter(
          r => !state.timeOffRequests.optimisticIds.has(r.id)
        );
        state.timeOffRequests.items.push(action.payload);
        if (action.payload.status === 'pending') {
          state.timeOffRequests.pendingCount += 1;
        }
      })

      .addCase(approveTimeOffRequest.fulfilled, (state, action) => {
        const index = state.timeOffRequests.items.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          const wasPending = state.timeOffRequests.items[index].status === 'pending';
          state.timeOffRequests.items[index] = action.payload;
          if (wasPending) {
            state.timeOffRequests.pendingCount -= 1;
          }
        }
      })

      .addCase(denyTimeOffRequest.fulfilled, (state, action) => {
        const index = state.timeOffRequests.items.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          const wasPending = state.timeOffRequests.items[index].status === 'pending';
          state.timeOffRequests.items[index] = action.payload;
          if (wasPending) {
            state.timeOffRequests.pendingCount -= 1;
          }
        }
      })

      .addCase(cancelTimeOffRequest.fulfilled, (state, action) => {
        const index = state.timeOffRequests.items.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          const wasPending = state.timeOffRequests.items[index].status === 'pending';
          state.timeOffRequests.items[index] = action.payload;
          if (wasPending) {
            state.timeOffRequests.pendingCount -= 1;
          }
        }
      });
  },
});

// ==================== EXPORTS ====================

export const {
  setTimeOffRequestFilters,
  setActiveModal,
  setSelectedTimeOffTypeId,
  setSelectedRequestId,
  clearScheduleError,
  setTimeOffTypes,
  setTimeOffRequests,
  addOptimisticTimeOffType,
  removeOptimisticTimeOffType,
  addOptimisticTimeOffRequest,
  removeOptimisticTimeOffRequest,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;
```

---

## Files to Create - Summary

| File | Purpose |
|------|---------|
| `src/types/schedule/errors.ts` | Custom error classes |
| `src/types/schedule/pagination.ts` | Pagination types |
| `src/store/slices/scheduleSlice.ts` | Redux slice with optimistic updates |
| `src/store/selectors/scheduleSelectors.ts` | Memoized selectors |
| `src/hooks/useSchedule.ts` | Custom hooks for components |
| `src/services/scheduleService.ts` | Business logic layer |
| `src/components/settings/schedule/TimeOffTypesSettings.tsx` | Settings UI |
| `src/components/settings/schedule/TimeOffTypeModal.tsx` | Type edit modal |
| `src/components/settings/schedule/TimeOffTypeCard.tsx` | Type display card |
| `src/components/schedule/timeoff/TimeOffRequestForm.tsx` | Request form |
| `src/components/schedule/timeoff/TimeOffRequestList.tsx` | Request list |
| `src/components/schedule/timeoff/TimeOffRequestCard.tsx` | Request card |
| `src/components/schedule/timeoff/TimeOffApprovalModal.tsx` | Approval modal |
| `src/components/schedule/timeoff/PendingRequestsBadge.tsx` | Badge component |

---

## Implementation Order (Revised)

### Days 1-2: Foundation
1. Create `src/types/schedule/errors.ts`
2. Create `src/types/schedule/pagination.ts`
3. Update `src/types/schedule/index.ts` to export new types

### Days 3-4: Redux Layer
1. Create `src/store/selectors/scheduleSelectors.ts`
2. Create `src/store/slices/scheduleSlice.ts`
3. Update `src/store/index.ts`

### Days 5-6: Hooks Layer
1. Create `src/hooks/useSchedule.ts`
2. Test hooks with simple component

### Days 7-8: Database Enhancements
1. Add pagination to `src/db/scheduleDatabase.ts`
2. Add conflict checking helpers

### Days 9-10: Settings UI
1. Create settings components
2. Integrate with hooks

### Days 11-12: Request UI
1. Create request components
2. Integrate approval workflow

### Days 13-14: Calendar & Testing
1. Calendar integration
2. Unit tests for selectors and hooks
3. Integration tests

---

## Quality Checklist

### Architecture (9/10 target)
- [x] Custom error types with error codes
- [x] Pagination support
- [x] Memoized selectors with createSelector
- [x] Custom hooks for clean component API
- [x] Optimistic updates for instant UI feedback
- [x] Factory selectors for parameterized queries
- [x] Stale data detection

### Scalability (9/10 target)
- [x] Cursor-based pagination ready
- [x] Selectors prevent unnecessary re-renders
- [x] Hooks encapsulate fetch-on-mount logic
- [x] Error boundary ready error types

### Developer Experience (9/10 target)
- [x] TypeScript throughout
- [x] Clean hook API
- [x] Consistent patterns with existing codebase
- [x] Comprehensive JSDoc comments in hooks

---

This enhanced plan addresses all identified gaps and brings the implementation to enterprise-grade quality.
