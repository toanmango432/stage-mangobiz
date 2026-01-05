/**
 * Schedule Module Hooks
 * Custom hooks for clean component integration with the Schedule module
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  // Time-Off Thunks
  fetchTimeOffTypes,
  fetchAllTimeOffTypes,
  createTimeOffType,
  updateTimeOffType,
  deleteTimeOffType,
  seedTimeOffTypes,
  fetchTimeOffRequests,
  fetchPendingCount,
  createTimeOffRequest,
  approveTimeOffRequest,
  denyTimeOffRequest,
  cancelTimeOffRequest,
  // Blocked Time Thunks
  fetchBlockedTimeTypes,
  fetchAllBlockedTimeTypes,
  createBlockedTimeType,
  updateBlockedTimeType,
  deleteBlockedTimeType,
  seedBlockedTimeTypes,
  fetchBlockedTimeEntries,
  createBlockedTimeEntry,
  deleteBlockedTimeEntry,
  deleteBlockedTimeSeries,
  // Closed Period Thunks
  fetchClosedPeriods,
  createClosedPeriod,
  updateClosedPeriod,
  deleteClosedPeriod,
  // Time-Off Actions
  setTimeOffRequestFilters,
  resetTimeOffRequestFilters,
  setActiveModal,
  closeModal,
  setSelectedTimeOffTypeId,
  setSelectedRequestId,
  openEditTimeOffTypeModal,
  openApproveRequestModal,
  openDenyRequestModal,
  clearScheduleError,
  // Blocked Time Actions
  setBlockedTimeFilters,
  resetBlockedTimeFilters,
  setSelectedBlockedTimeTypeId,
  setSelectedBlockedTimeEntryId,
  openEditBlockedTimeTypeModal,
  openBlockTimeModal,
  closeBlockTimeModal,
  openEditBlockedTimeEntryModal,
  // Closed Period Actions
  setSelectedClosedPeriodId,
  openCreateClosedPeriodModal,
  openEditClosedPeriodModal,
  type ScheduleModalType,
  type BlockedTimeFilters,
} from '../store/slices/scheduleSlice';
import {
  // Time-Off Selectors
  selectActiveTimeOffTypes,
  selectAllTimeOffTypesSorted,
  selectTimeOffTypesLoading,
  selectTimeOffTypesError,
  selectTimeOffTypesNeedsRefresh,
  selectTimeOffTypesMap,
  selectFilteredTimeOffRequests,
  selectPendingTimeOffRequests,
  selectApprovedTimeOffRequests,
  selectTimeOffRequestsLoading,
  selectTimeOffRequestsError,
  selectTimeOffRequestFilters,
  selectPendingTimeOffCount,
  selectTimeOffRequestsNeedsRefresh,
  selectActiveModal,
  selectSelectedTimeOffType,
  selectSelectedTimeOffRequest,
  selectTimeOffStats,
  selectScheduleLoading,
  selectScheduleError,
  makeSelectTimeOffRequestsByStaff,
  makeSelectApprovedTimeOffForDateRange,
  makeSelectStaffApprovedTimeOffForDateRange,
  // Blocked Time Selectors
  selectActiveBlockedTimeTypes,
  selectAllBlockedTimeTypesSorted,
  selectBlockedTimeTypesLoading,
  selectBlockedTimeTypesError,
  selectBlockedTimeTypesNeedsRefresh,
  selectBlockedTimeTypesMap,
  selectFilteredBlockedTimeEntries,
  selectBlockedTimeEntriesLoading,
  selectBlockedTimeEntriesError,
  selectBlockedTimeFilters,
  selectBlockedTimeEntriesNeedsRefresh,
  selectSelectedBlockedTimeType,
  selectSelectedBlockedTimeEntry,
  selectBlockTimeModalOpen,
  selectBlockTimeModalContext,
  selectBlockedTimeLoading,
  makeSelectBlockedTimeEntriesByStaff,
  makeSelectBlockedTimeForDateRange,
  makeSelectStaffBlockedTimeForDate,
  makeSelectStaffBlockedTimeForDateRange,
  // Closed Period Selectors
//   selectClosedPeriods,
  selectClosedPeriodsLoading,
  selectClosedPeriodsError,
  selectClosedPeriodsNeedsRefresh,
  selectUpcomingClosedPeriods,
  selectAllClosedPeriodsSorted,
  selectClosedPeriodsMap,
  selectSelectedClosedPeriod,
  makeSelectClosedPeriodsForDateRange,
  makeSelectIsDateClosed,
  makeSelectClosedPeriodForDate,
} from '../store/selectors/scheduleSelectors';
import type {
  CreateTimeOffTypeInput,
  UpdateTimeOffTypeInput,
  CreateTimeOffRequestInput,
  TimeOffRequestFilters,
  CreateBlockedTimeTypeInput,
  UpdateBlockedTimeTypeInput,
  CreateBlockedTimeEntryInput,
  CreateBusinessClosedPeriodInput,
} from '../types/schedule';

// ==================== CONTEXT INTERFACE ====================

export interface ScheduleContext {
  userId: string;
  userName: string;
  storeId: string;
  tenantId: string;
  deviceId: string;
  isManager?: boolean;
}

// ==================== TIME-OFF TYPES HOOKS ====================

/**
 * Hook for fetching and accessing active time-off types
 * Auto-fetches on mount or when data is stale
 */
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
    if (storeId) {
      return dispatch(fetchTimeOffTypes(storeId));
    }
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

/**
 * Hook for fetching all time-off types including inactive (for settings)
 */
export function useAllTimeOffTypes(storeId: string) {
  const dispatch = useAppDispatch();
  const types = useAppSelector(selectAllTimeOffTypesSorted);
  const loading = useAppSelector(selectTimeOffTypesLoading);
  const error = useAppSelector(selectTimeOffTypesError);
  const needsRefresh = useAppSelector(selectTimeOffTypesNeedsRefresh);

  useEffect(() => {
    if (needsRefresh && storeId) {
      dispatch(fetchAllTimeOffTypes(storeId));
    }
  }, [dispatch, storeId, needsRefresh]);

  const refetch = useCallback(() => {
    if (storeId) {
      return dispatch(fetchAllTimeOffTypes(storeId));
    }
  }, [dispatch, storeId]);

  return {
    types,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for time-off type CRUD mutations
 */
export function useTimeOffTypeMutations(context: ScheduleContext) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectTimeOffTypesLoading);

  const create = useCallback(
    async (input: CreateTimeOffTypeInput) => {
      const result = await dispatch(
        createTimeOffType({
          input,
          userId: context.userId,
          storeId: context.storeId,
          tenantId: context.tenantId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const update = useCallback(
    async (id: string, updates: UpdateTimeOffTypeInput) => {
      const result = await dispatch(
        updateTimeOffType({
          id,
          updates,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const remove = useCallback(
    async (id: string) => {
      await dispatch(
        deleteTimeOffType({
          id,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
    },
    [dispatch, context]
  );

  const seed = useCallback(async () => {
    const result = await dispatch(
      seedTimeOffTypes({
        storeId: context.storeId,
        tenantId: context.tenantId,
        userId: context.userId,
        deviceId: context.deviceId,
      })
    ).unwrap();
    return result;
  }, [dispatch, context]);

  return {
    create,
    update,
    remove,
    seed,
    loading,
  };
}

/**
 * Hook to get time-off types as a lookup map
 */
export function useTimeOffTypesMap() {
  return useAppSelector(selectTimeOffTypesMap);
}

// ==================== TIME-OFF REQUESTS HOOKS ====================

/**
 * Hook for fetching and filtering time-off requests
 */
export function useTimeOffRequests(storeId: string) {
  const dispatch = useAppDispatch();
  const requests = useAppSelector(selectFilteredTimeOffRequests);
  const loading = useAppSelector(selectTimeOffRequestsLoading);
  const error = useAppSelector(selectTimeOffRequestsError);
  const filters = useAppSelector(selectTimeOffRequestFilters);
  const pendingCount = useAppSelector(selectPendingTimeOffCount);
  const needsRefresh = useAppSelector(selectTimeOffRequestsNeedsRefresh);

  // Initial fetch
  useEffect(() => {
    if (storeId) {
      dispatch(fetchTimeOffRequests({ storeId, filters }));
      dispatch(fetchPendingCount(storeId));
    }
  }, [dispatch, storeId]); // Don't include filters to avoid refetch on filter change

  const refetch = useCallback(() => {
    if (storeId) {
      dispatch(fetchTimeOffRequests({ storeId, filters }));
      dispatch(fetchPendingCount(storeId));
    }
  }, [dispatch, storeId, filters]);

  const setFilters = useCallback(
    (newFilters: Partial<TimeOffRequestFilters>) => {
      dispatch(setTimeOffRequestFilters(newFilters));
    },
    [dispatch]
  );

  const resetFilters = useCallback(() => {
    dispatch(resetTimeOffRequestFilters());
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
    needsRefresh,
    refetch,
    setFilters,
    resetFilters,
    clearError,
  };
}

/**
 * Hook for pending time-off requests only
 */
export function usePendingTimeOffRequests() {
  const requests = useAppSelector(selectPendingTimeOffRequests);
  const pendingCount = useAppSelector(selectPendingTimeOffCount);
  return { requests, pendingCount };
}

/**
 * Hook for approved time-off requests only
 */
export function useApprovedTimeOffRequests() {
  return useAppSelector(selectApprovedTimeOffRequests);
}

/**
 * Hook for time-off requests by staff ID
 */
export function useStaffTimeOffRequests(staffId: string) {
  const selectByStaff = useMemo(makeSelectTimeOffRequestsByStaff, []);
  const requests = useAppSelector(state => selectByStaff(state, staffId));
  return { requests };
}

/**
 * Hook for approved time-off in a date range (for calendar display)
 */
export function useCalendarTimeOff(startDate: string, endDate: string) {
  const selectForDateRange = useMemo(makeSelectApprovedTimeOffForDateRange, []);
  const timeOffEntries = useAppSelector(state => selectForDateRange(state, startDate, endDate));
  return { timeOffEntries };
}

/**
 * Hook for staff's approved time-off in a date range
 */
export function useStaffCalendarTimeOff(staffId: string, startDate: string, endDate: string) {
  const selectForStaffDateRange = useMemo(makeSelectStaffApprovedTimeOffForDateRange, []);
  const timeOffEntries = useAppSelector(state =>
    selectForStaffDateRange(state, staffId, startDate, endDate)
  );
  return { timeOffEntries };
}

/**
 * Hook for time-off request CRUD mutations
 */
export function useTimeOffRequestMutations(context: ScheduleContext) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectTimeOffRequestsLoading);

  const create = useCallback(
    async (input: CreateTimeOffRequestInput) => {
      const result = await dispatch(
        createTimeOffRequest({
          input,
          userId: context.userId,
          storeId: context.storeId,
          tenantId: context.tenantId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const approve = useCallback(
    async (id: string, notes?: string) => {
      const result = await dispatch(
        approveTimeOffRequest({
          id,
          approverName: context.userName,
          notes: notes ?? null,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const deny = useCallback(
    async (id: string, reason: string) => {
      const result = await dispatch(
        denyTimeOffRequest({
          id,
          denierName: context.userName,
          reason,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const cancel = useCallback(
    async (id: string, reason?: string) => {
      const result = await dispatch(
        cancelTimeOffRequest({
          id,
          reason: reason ?? null,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  return {
    create,
    approve,
    deny,
    cancel,
    loading,
  };
}

// ==================== STATS HOOK ====================

/**
 * Hook for time-off statistics (for dashboard)
 */
export function useTimeOffStats() {
  return useAppSelector(selectTimeOffStats);
}

// ==================== MODAL MANAGEMENT HOOKS ====================

/**
 * Hook for managing schedule modals
 */
export function useScheduleModals() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector(selectActiveModal);
  const selectedType = useAppSelector(selectSelectedTimeOffType);
  const selectedRequest = useAppSelector(selectSelectedTimeOffRequest);

  const openModal = useCallback(
    (modal: ScheduleModalType) => {
      dispatch(setActiveModal(modal));
    },
    [dispatch]
  );

  const close = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  const openCreateTypeModal = useCallback(() => {
    dispatch(setActiveModal('createTimeOffType'));
  }, [dispatch]);

  const openEditType = useCallback(
    (typeId: string) => {
      dispatch(openEditTimeOffTypeModal(typeId));
    },
    [dispatch]
  );

  const openCreateRequestModal = useCallback(() => {
    dispatch(setActiveModal('createTimeOffRequest'));
  }, [dispatch]);

  const openApprove = useCallback(
    (requestId: string) => {
      dispatch(openApproveRequestModal(requestId));
    },
    [dispatch]
  );

  const openDeny = useCallback(
    (requestId: string) => {
      dispatch(openDenyRequestModal(requestId));
    },
    [dispatch]
  );

  const selectType = useCallback(
    (typeId: string | null) => {
      dispatch(setSelectedTimeOffTypeId(typeId));
    },
    [dispatch]
  );

  const selectRequest = useCallback(
    (requestId: string | null) => {
      dispatch(setSelectedRequestId(requestId));
    },
    [dispatch]
  );

  return {
    activeModal,
    selectedType,
    selectedRequest,
    openModal,
    close,
    openCreateTypeModal,
    openEditType,
    openCreateRequestModal,
    openApprove,
    openDeny,
    selectType,
    selectRequest,
  };
}

// ==================== COMBINED LOADING/ERROR HOOKS ====================

/**
 * Hook for overall schedule loading state
 */
export function useScheduleLoading() {
  return useAppSelector(selectScheduleLoading);
}

/**
 * Hook for overall schedule error state
 */
export function useScheduleError() {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectScheduleError);

  const clearError = useCallback(() => {
    dispatch(clearScheduleError());
  }, [dispatch]);

  return { error, clearError };
}

// ==================== INITIALIZATION HOOK ====================

/**
 * Hook to initialize schedule data for a store
 * Useful for app initialization
 */
export function useScheduleInit(storeId: string, context?: ScheduleContext) {
  const dispatch = useAppDispatch();
  const typesNeedsRefresh = useAppSelector(selectTimeOffTypesNeedsRefresh);
  const requestsNeedsRefresh = useAppSelector(selectTimeOffRequestsNeedsRefresh);
  const loading = useAppSelector(selectScheduleLoading);

  useEffect(() => {
    if (!storeId) return;

    // Fetch types if needed
    if (typesNeedsRefresh) {
      dispatch(fetchTimeOffTypes(storeId));
    }

    // Fetch requests if needed
    if (requestsNeedsRefresh) {
      dispatch(fetchTimeOffRequests({ storeId }));
      dispatch(fetchPendingCount(storeId));
    }
  }, [dispatch, storeId, typesNeedsRefresh, requestsNeedsRefresh]);

  // Seed defaults if no types exist (one-time setup)
  const seedDefaults = useCallback(async () => {
    if (!context) {
      console.warn('useScheduleInit: context required for seeding defaults');
      return;
    }
    await dispatch(
      seedTimeOffTypes({
        storeId: context.storeId,
        tenantId: context.tenantId,
        userId: context.userId,
        deviceId: context.deviceId,
      })
    );
  }, [dispatch, context]);

  return {
    loading,
    seedDefaults,
  };
}

// ==================== BLOCKED TIME TYPES HOOKS ====================

/**
 * Hook for fetching and accessing active blocked time types
 * Auto-fetches on mount or when data is stale
 */
export function useBlockedTimeTypes(storeId: string) {
  const dispatch = useAppDispatch();
  const types = useAppSelector(selectActiveBlockedTimeTypes);
  const loading = useAppSelector(selectBlockedTimeTypesLoading);
  const error = useAppSelector(selectBlockedTimeTypesError);
  const needsRefresh = useAppSelector(selectBlockedTimeTypesNeedsRefresh);

  useEffect(() => {
    if (needsRefresh && storeId) {
      dispatch(fetchBlockedTimeTypes(storeId));
    }
  }, [dispatch, storeId, needsRefresh]);

  const refetch = useCallback(() => {
    if (storeId) {
      return dispatch(fetchBlockedTimeTypes(storeId));
    }
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

/**
 * Hook for fetching all blocked time types including inactive (for settings)
 */
export function useAllBlockedTimeTypes(storeId: string) {
  const dispatch = useAppDispatch();
  const types = useAppSelector(selectAllBlockedTimeTypesSorted);
  const loading = useAppSelector(selectBlockedTimeTypesLoading);
  const error = useAppSelector(selectBlockedTimeTypesError);
  const needsRefresh = useAppSelector(selectBlockedTimeTypesNeedsRefresh);

  useEffect(() => {
    if (needsRefresh && storeId) {
      dispatch(fetchAllBlockedTimeTypes(storeId));
    }
  }, [dispatch, storeId, needsRefresh]);

  const refetch = useCallback(() => {
    if (storeId) {
      return dispatch(fetchAllBlockedTimeTypes(storeId));
    }
  }, [dispatch, storeId]);

  return {
    types,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for blocked time type CRUD mutations
 */
export function useBlockedTimeTypeMutations(context: ScheduleContext) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectBlockedTimeTypesLoading);

  const create = useCallback(
    async (input: CreateBlockedTimeTypeInput) => {
      const result = await dispatch(
        createBlockedTimeType({
          input,
          userId: context.userId,
          storeId: context.storeId,
          tenantId: context.tenantId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const update = useCallback(
    async (id: string, updates: UpdateBlockedTimeTypeInput) => {
      const result = await dispatch(
        updateBlockedTimeType({
          id,
          updates,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const remove = useCallback(
    async (id: string) => {
      await dispatch(
        deleteBlockedTimeType({
          id,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
    },
    [dispatch, context]
  );

  const seed = useCallback(async () => {
    const result = await dispatch(
      seedBlockedTimeTypes({
        storeId: context.storeId,
        tenantId: context.tenantId,
        userId: context.userId,
        deviceId: context.deviceId,
      })
    ).unwrap();
    return result;
  }, [dispatch, context]);

  return {
    create,
    update,
    remove,
    seed,
    loading,
  };
}

/**
 * Hook to get blocked time types as a lookup map
 */
export function useBlockedTimeTypesMap() {
  return useAppSelector(selectBlockedTimeTypesMap);
}

// ==================== BLOCKED TIME ENTRIES HOOKS ====================

/**
 * Hook for fetching and filtering blocked time entries
 */
export function useBlockedTimeEntries(storeId: string) {
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectFilteredBlockedTimeEntries);
  const loading = useAppSelector(selectBlockedTimeEntriesLoading);
  const error = useAppSelector(selectBlockedTimeEntriesError);
  const filters = useAppSelector(selectBlockedTimeFilters);
  const needsRefresh = useAppSelector(selectBlockedTimeEntriesNeedsRefresh);

  useEffect(() => {
    if (storeId) {
      dispatch(fetchBlockedTimeEntries({ storeId, filters }));
    }
  }, [dispatch, storeId]);

  const refetch = useCallback(() => {
    if (storeId) {
      dispatch(fetchBlockedTimeEntries({ storeId, filters }));
    }
  }, [dispatch, storeId, filters]);

  const setFilters = useCallback(
    (newFilters: Partial<BlockedTimeFilters>) => {
      dispatch(setBlockedTimeFilters(newFilters));
    },
    [dispatch]
  );

  const resetFilters = useCallback(() => {
    dispatch(resetBlockedTimeFilters());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearScheduleError());
  }, [dispatch]);

  return {
    entries,
    loading,
    error,
    filters,
    needsRefresh,
    refetch,
    setFilters,
    resetFilters,
    clearError,
  };
}

/**
 * Hook for blocked time entries by staff ID
 */
export function useStaffBlockedTimeEntries(staffId: string) {
  const selectByStaff = useMemo(makeSelectBlockedTimeEntriesByStaff, []);
  const entries = useAppSelector(state => selectByStaff(state, staffId));
  return { entries };
}

/**
 * Hook for blocked time in a date range (for calendar display)
 */
export function useCalendarBlockedTime(startDate: string, endDate: string) {
  const selectForDateRange = useMemo(makeSelectBlockedTimeForDateRange, []);
  const entries = useAppSelector(state => selectForDateRange(state, startDate, endDate));
  return { entries };
}

/**
 * Hook for staff's blocked time on a specific date
 */
export function useStaffBlockedTimeForDate(staffId: string, date: string) {
  const selectForStaffDate = useMemo(makeSelectStaffBlockedTimeForDate, []);
  const entries = useAppSelector(state => selectForStaffDate(state, staffId, date));
  return { entries };
}

/**
 * Hook for staff's blocked time in a date range
 */
export function useStaffBlockedTimeForDateRange(staffId: string, startDate: string, endDate: string) {
  const selectForStaffDateRange = useMemo(makeSelectStaffBlockedTimeForDateRange, []);
  const entries = useAppSelector(state => selectForStaffDateRange(state, staffId, startDate, endDate));
  return { entries };
}

/**
 * Hook for blocked time entry CRUD mutations
 */
export function useBlockedTimeEntryMutations(context: ScheduleContext) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectBlockedTimeEntriesLoading);

  const create = useCallback(
    async (input: CreateBlockedTimeEntryInput) => {
      const result = await dispatch(
        createBlockedTimeEntry({
          input,
          userId: context.userId,
          storeId: context.storeId,
          tenantId: context.tenantId,
          deviceId: context.deviceId,
          isManager: context.isManager,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const remove = useCallback(
    async (id: string) => {
      await dispatch(
        deleteBlockedTimeEntry({
          id,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
    },
    [dispatch, context]
  );

  const removeSeries = useCallback(
    async (seriesId: string) => {
      const result = await dispatch(
        deleteBlockedTimeSeries({
          seriesId,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  return {
    create,
    remove,
    removeSeries,
    loading,
  };
}

// ==================== BLOCKED TIME MODAL MANAGEMENT HOOKS ====================

/**
 * Hook for managing block time modal
 */
export function useBlockTimeModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectBlockTimeModalOpen);
  const modalContext = useAppSelector(selectBlockTimeModalContext);
  const selectedType = useAppSelector(selectSelectedBlockedTimeType);
  const selectedEntry = useAppSelector(selectSelectedBlockedTimeEntry);

  const open = useCallback(
    (context?: { staffId?: string; date?: string; startTime?: string }) => {
      dispatch(openBlockTimeModal(context));
    },
    [dispatch]
  );

  const close = useCallback(() => {
    dispatch(closeBlockTimeModal());
  }, [dispatch]);

  const openCreateTypeModal = useCallback(() => {
    dispatch(setActiveModal('createBlockedTimeType'));
  }, [dispatch]);

  const openEditType = useCallback(
    (typeId: string) => {
      dispatch(openEditBlockedTimeTypeModal(typeId));
    },
    [dispatch]
  );

  const openEditEntry = useCallback(
    (entryId: string) => {
      dispatch(openEditBlockedTimeEntryModal(entryId));
    },
    [dispatch]
  );

  const selectType = useCallback(
    (typeId: string | null) => {
      dispatch(setSelectedBlockedTimeTypeId(typeId));
    },
    [dispatch]
  );

  const selectEntry = useCallback(
    (entryId: string | null) => {
      dispatch(setSelectedBlockedTimeEntryId(entryId));
    },
    [dispatch]
  );

  return {
    isOpen,
    modalContext,
    selectedType,
    selectedEntry,
    open,
    close,
    openCreateTypeModal,
    openEditType,
    openEditEntry,
    selectType,
    selectEntry,
  };
}

/**
 * Hook for blocked time loading state
 */
export function useBlockedTimeLoading() {
  return useAppSelector(selectBlockedTimeLoading);
}

// ==================== BUSINESS CLOSED PERIODS HOOKS ====================

/**
 * Hook for fetching and accessing closed periods
 * Auto-fetches on mount or when data is stale
 */
export function useClosedPeriods(storeId: string) {
  const dispatch = useAppDispatch();
  const periods = useAppSelector(selectAllClosedPeriodsSorted);
  const loading = useAppSelector(selectClosedPeriodsLoading);
  const error = useAppSelector(selectClosedPeriodsError);
  const needsRefresh = useAppSelector(selectClosedPeriodsNeedsRefresh);

  useEffect(() => {
    if (needsRefresh && storeId) {
      dispatch(fetchClosedPeriods(storeId));
    }
  }, [dispatch, storeId, needsRefresh]);

  const refetch = useCallback(() => {
    if (storeId) {
      return dispatch(fetchClosedPeriods(storeId));
    }
  }, [dispatch, storeId]);

  const clearError = useCallback(() => {
    dispatch(clearScheduleError());
  }, [dispatch]);

  return {
    periods,
    loading,
    error,
    refetch,
    clearError,
  };
}

/**
 * Hook for upcoming closed periods only
 */
export function useUpcomingClosedPeriods() {
  return useAppSelector(selectUpcomingClosedPeriods);
}

/**
 * Hook for closed periods CRUD mutations
 */
export function useClosedPeriodMutations(context: ScheduleContext) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectClosedPeriodsLoading);

  const create = useCallback(
    async (input: CreateBusinessClosedPeriodInput) => {
      const result = await dispatch(
        createClosedPeriod({
          input,
          userId: context.userId,
          storeId: context.storeId,
          tenantId: context.tenantId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const update = useCallback(
    async (id: string, updates: Partial<CreateBusinessClosedPeriodInput>) => {
      const result = await dispatch(
        updateClosedPeriod({
          id,
          updates,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const remove = useCallback(
    async (id: string) => {
      await dispatch(
        deleteClosedPeriod({
          id,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
    },
    [dispatch, context]
  );

  return {
    create,
    update,
    remove,
    loading,
  };
}

/**
 * Hook for closed periods as a lookup map
 */
export function useClosedPeriodsMap() {
  return useAppSelector(selectClosedPeriodsMap);
}

/**
 * Hook for closed periods in a date range (for calendar display)
 */
export function useCalendarClosedPeriods(startDate: string, endDate: string) {
  const selectForDateRange = useMemo(makeSelectClosedPeriodsForDateRange, []);
  const periods = useAppSelector(state => selectForDateRange(state, startDate, endDate));
  return { periods };
}

/**
 * Hook to check if a specific date is closed
 */
export function useDateClosed(date: string, locationId?: string) {
  const selectIsClosed = useMemo(makeSelectIsDateClosed, []);
  const isClosed = useAppSelector(state => selectIsClosed(state, date, locationId));
  return isClosed;
}

/**
 * Hook to get the closed period for a specific date (if any)
 */
export function useClosedPeriodForDate(date: string, locationId?: string) {
  const selectPeriod = useMemo(makeSelectClosedPeriodForDate, []);
  const period = useAppSelector(state => selectPeriod(state, date, locationId));
  return period;
}

/**
 * Hook for managing closed period modals
 */
export function useClosedPeriodModals() {
  const dispatch = useAppDispatch();
  const selectedPeriod = useAppSelector(selectSelectedClosedPeriod);

  const openCreate = useCallback(() => {
    dispatch(openCreateClosedPeriodModal());
  }, [dispatch]);

  const openEdit = useCallback(
    (periodId: string) => {
      dispatch(openEditClosedPeriodModal(periodId));
    },
    [dispatch]
  );

  const close = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  const selectPeriod = useCallback(
    (periodId: string | null) => {
      dispatch(setSelectedClosedPeriodId(periodId));
    },
    [dispatch]
  );

  return {
    selectedPeriod,
    openCreate,
    openEdit,
    close,
    selectPeriod,
  };
}

/**
 * Hook for closed periods loading state
 */
export function useClosedPeriodsLoading() {
  return useAppSelector(selectClosedPeriodsLoading);
}

// ==================== STAFF SCHEDULE HOOKS ====================

import {
  fetchStaffSchedules,
  fetchStaffSchedulesByStaff,
  fetchCurrentStaffSchedule,
  createStaffSchedule,
  updateStaffSchedule,
  deleteStaffSchedule,
  setSelectedStaffId as setStaffScheduleSelectedStaffId,
  setSelectedScheduleId,
  setEditingWeekNumber,
  openScheduleModal,
  closeScheduleModal,
  clearStaffScheduleError,
  selectStaffSchedules,
  selectStaffSchedulesLoading,
  selectStaffSchedulesError,
  selectStaffSchedulesByStaffId,
  selectCurrentStaffSchedule,
  selectStaffScheduleLoadingByStaff,
  selectStaffScheduleUI,
  selectSelectedStaffSchedule,
  selectEditingWeekNumber,
  selectScheduleModalOpen,
} from '../store/slices/staffScheduleSlice';
import type { StaffSchedule, CreateStaffScheduleInput } from '../types/schedule/staffSchedule';
import {
  getScheduleForDate,
  isStaffWorkingOnDate,
  getWorkingHoursForDate,
  getWeekNumberForDate,
} from '../utils/scheduleUtils';

/**
 * Hook for fetching and managing all staff schedules for a store.
 */
export function useStaffSchedules(storeId: string) {
  const dispatch = useAppDispatch();
  const schedules = useAppSelector(selectStaffSchedules);
  const loading = useAppSelector(selectStaffSchedulesLoading);
  const error = useAppSelector(selectStaffSchedulesError);

  const fetch = useCallback(() => {
    if (storeId) {
      dispatch(fetchStaffSchedules(storeId));
    }
  }, [dispatch, storeId]);

  // Auto-fetch on mount
  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    schedules,
    loading,
    error,
    refetch: fetch,
  };
}

/**
 * Hook for fetching staff schedule for a specific staff member.
 */
export function useStaffScheduleForStaff(staffId: string) {
  const dispatch = useAppDispatch();
  const schedules = useAppSelector((state) => selectStaffSchedulesByStaffId(state, staffId));
  const currentSchedule = useAppSelector((state) => selectCurrentStaffSchedule(state, staffId));
  const loading = useAppSelector((state) => selectStaffScheduleLoadingByStaff(state, staffId));
  const error = useAppSelector(selectStaffSchedulesError);

  const fetch = useCallback(() => {
    if (staffId) {
      dispatch(fetchStaffSchedulesByStaff(staffId));
    }
  }, [dispatch, staffId]);

  const fetchCurrent = useCallback(() => {
    if (staffId) {
      dispatch(fetchCurrentStaffSchedule(staffId));
    }
  }, [dispatch, staffId]);

  // Auto-fetch on mount
  useEffect(() => {
    fetch();
    fetchCurrent();
  }, [fetch, fetchCurrent]);

  return {
    schedules,
    currentSchedule,
    loading,
    error,
    refetch: fetch,
    refetchCurrent: fetchCurrent,
  };
}

/**
 * Hook for getting the working hours for a staff member on a specific date.
 * Useful for calendar integration.
 */
export function useStaffWorkingHoursForDate(staffId: string, date: string) {
  const { currentSchedule, loading } = useStaffScheduleForStaff(staffId);

  const workingHours = useMemo(() => {
    if (!currentSchedule) return [];
    return getWorkingHoursForDate(currentSchedule, date);
  }, [currentSchedule, date]);

  const isWorking = useMemo(() => {
    if (!currentSchedule) return false;
    return isStaffWorkingOnDate(currentSchedule, date);
  }, [currentSchedule, date]);

  const dayConfig = useMemo(() => {
    if (!currentSchedule) return null;
    return getScheduleForDate(currentSchedule, date);
  }, [currentSchedule, date]);

  return {
    workingHours,
    isWorking,
    dayConfig,
    loading,
  };
}

/**
 * Hook for getting which week of the pattern applies to a specific date.
 */
export function useWeekNumberForDate(schedule: StaffSchedule | null, date: string) {
  return useMemo(() => {
    if (!schedule) return 1;
    if (schedule.patternType === 'fixed') return 1;
    const anchorDate = schedule.patternAnchorDate || schedule.effectiveFrom;
    return getWeekNumberForDate(anchorDate, date, schedule.patternWeeks);
  }, [schedule, date]);
}

/**
 * Hook for staff schedule mutations (create, update, delete).
 */
export function useStaffScheduleMutations(context: {
  userId: string;
  storeId: string;
  tenantId: string;
  deviceId: string;
}) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectStaffSchedulesLoading);
  const error = useAppSelector(selectStaffSchedulesError);

  const create = useCallback(
    async (input: CreateStaffScheduleInput) => {
      const result = await dispatch(createStaffSchedule({ input, context }));
      if (createStaffSchedule.rejected.match(result)) {
        throw new Error(result.payload as string);
      }
      return result.payload as StaffSchedule;
    },
    [dispatch, context]
  );

  const update = useCallback(
    async (id: string, updates: Partial<CreateStaffScheduleInput>) => {
      const result = await dispatch(
        updateStaffSchedule({
          id,
          updates,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      );
      if (updateStaffSchedule.rejected.match(result)) {
        throw new Error(result.payload as string);
      }
      return result.payload as StaffSchedule;
    },
    [dispatch, context]
  );

  const remove = useCallback(
    async (id: string) => {
      const result = await dispatch(
        deleteStaffSchedule({
          id,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      );
      if (deleteStaffSchedule.rejected.match(result)) {
        throw new Error(result.payload as string);
      }
    },
    [dispatch, context]
  );

  const clearError = useCallback(() => {
    dispatch(clearStaffScheduleError());
  }, [dispatch]);

  return {
    create,
    update,
    remove,
    loading,
    error,
    clearError,
  };
}

/**
 * Hook for staff schedule modal UI state.
 */
export function useStaffScheduleModal() {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(selectStaffScheduleUI);
  const selectedSchedule = useAppSelector(selectSelectedStaffSchedule);
  const editingWeek = useAppSelector(selectEditingWeekNumber);
  const isOpen = useAppSelector(selectScheduleModalOpen);

  const open = useCallback(
    (params: { staffId?: string; scheduleId?: string } = {}) => {
      dispatch(openScheduleModal(params));
    },
    [dispatch]
  );

  const close = useCallback(() => {
    dispatch(closeScheduleModal());
  }, [dispatch]);

  const setWeek = useCallback(
    (weekNumber: number) => {
      dispatch(setEditingWeekNumber(weekNumber));
    },
    [dispatch]
  );

  const setStaffId = useCallback(
    (staffId: string | null) => {
      dispatch(setStaffScheduleSelectedStaffId(staffId));
    },
    [dispatch]
  );

  const setScheduleId = useCallback(
    (scheduleId: string | null) => {
      dispatch(setSelectedScheduleId(scheduleId));
    },
    [dispatch]
  );

  return {
    isOpen,
    selectedStaffId: ui.selectedStaffId,
    selectedSchedule,
    editingWeek,
    open,
    close,
    setWeek,
    setStaffId,
    setScheduleId,
  };
}
