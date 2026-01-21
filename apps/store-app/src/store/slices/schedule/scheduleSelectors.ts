/**
 * Schedule Module Selectors
 * Memoized selectors for efficient state access
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../index';
import type {
  TimeOffType,
  TimeOffRequest,
  TimeOffRequestStatus,
  BlockedTimeType,
  BlockedTimeEntry,
  BusinessClosedPeriod,
} from '../../../types/schedule';

// ==================== BASE SELECTORS ====================

export const selectScheduleState = (state: RootState) => state.schedule;

// --- Time-Off Types ---
export const selectTimeOffTypesState = (state: RootState) => state.schedule.timeOffTypes;
export const selectTimeOffTypes = (state: RootState) => state.schedule.timeOffTypes.items;
export const selectTimeOffTypesLoading = (state: RootState) => state.schedule.timeOffTypes.loading;
export const selectTimeOffTypesError = (state: RootState) => state.schedule.timeOffTypes.error;
export const selectTimeOffTypesLastFetched = (state: RootState) => state.schedule.timeOffTypes.lastFetched;

// --- Time-Off Requests ---
export const selectTimeOffRequestsState = (state: RootState) => state.schedule.timeOffRequests;
export const selectTimeOffRequests = (state: RootState) => state.schedule.timeOffRequests.items;
export const selectTimeOffRequestsLoading = (state: RootState) => state.schedule.timeOffRequests.loading;
export const selectTimeOffRequestsError = (state: RootState) => state.schedule.timeOffRequests.error;
export const selectTimeOffRequestFilters = (state: RootState) => state.schedule.timeOffRequests.filters;
export const selectPendingTimeOffCount = (state: RootState) => state.schedule.timeOffRequests.pendingCount;
export const selectTimeOffRequestsLastFetched = (state: RootState) => state.schedule.timeOffRequests.lastFetched;

// --- Blocked Time Types ---
export const selectBlockedTimeTypesState = (state: RootState) => state.schedule.blockedTimeTypes;
export const selectBlockedTimeTypes = (state: RootState) => state.schedule.blockedTimeTypes.items;
export const selectBlockedTimeTypesLoading = (state: RootState) => state.schedule.blockedTimeTypes.loading;
export const selectBlockedTimeTypesError = (state: RootState) => state.schedule.blockedTimeTypes.error;
export const selectBlockedTimeTypesLastFetched = (state: RootState) => state.schedule.blockedTimeTypes.lastFetched;

// --- Blocked Time Entries ---
export const selectBlockedTimeEntriesState = (state: RootState) => state.schedule.blockedTimeEntries;
export const selectBlockedTimeEntries = (state: RootState) => state.schedule.blockedTimeEntries.items;
export const selectBlockedTimeEntriesLoading = (state: RootState) => state.schedule.blockedTimeEntries.loading;
export const selectBlockedTimeEntriesError = (state: RootState) => state.schedule.blockedTimeEntries.error;
export const selectBlockedTimeFilters = (state: RootState) => state.schedule.blockedTimeEntries.filters;
export const selectBlockedTimeEntriesLastFetched = (state: RootState) => state.schedule.blockedTimeEntries.lastFetched;

// --- Business Closed Periods ---
export const selectClosedPeriodsState = (state: RootState) => state.schedule.closedPeriods;
export const selectClosedPeriods = (state: RootState) => state.schedule.closedPeriods.items;
export const selectClosedPeriodsLoading = (state: RootState) => state.schedule.closedPeriods.loading;
export const selectClosedPeriodsError = (state: RootState) => state.schedule.closedPeriods.error;
export const selectClosedPeriodsLastFetched = (state: RootState) => state.schedule.closedPeriods.lastFetched;

// --- UI State ---
export const selectScheduleUI = (state: RootState) => state.schedule.ui;
export const selectActiveModal = (state: RootState) => state.schedule.ui.activeModal;
export const selectSelectedTimeOffTypeId = (state: RootState) => state.schedule.ui.selectedTimeOffTypeId;
export const selectSelectedRequestId = (state: RootState) => state.schedule.ui.selectedRequestId;
export const selectSelectedBlockedTimeTypeId = (state: RootState) => state.schedule.ui.selectedBlockedTimeTypeId;
export const selectSelectedBlockedTimeEntryId = (state: RootState) => state.schedule.ui.selectedBlockedTimeEntryId;
export const selectBlockTimeModalOpen = (state: RootState) => state.schedule.ui.blockTimeModalOpen;
export const selectBlockTimeModalContext = (state: RootState) => state.schedule.ui.blockTimeModalContext;
export const selectSelectedClosedPeriodId = (state: RootState) => state.schedule.ui.selectedClosedPeriodId;

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
 * All time-off types including inactive, sorted by displayOrder
 */
export const selectAllTimeOffTypesSorted = createSelector(
  [selectTimeOffTypes],
  (types): TimeOffType[] =>
    types
      .filter(t => !t.isDeleted)
      .sort((a, b) => a.displayOrder - b.displayOrder)
);

/**
 * Time-off types as a lookup map for O(1) access
 */
export const selectTimeOffTypesMap = createSelector(
  [selectTimeOffTypes],
  (types): Map<string, TimeOffType> =>
    new Map(types.filter(t => !t.isDeleted).map(t => [t.id, t]))
);

/**
 * Get a specific time-off type by ID
 */
export const makeSelectTimeOffTypeById = () =>
  createSelector(
    [selectTimeOffTypesMap, (_state: RootState, typeId: string) => typeId],
    (typesMap, typeId): TimeOffType | undefined => typesMap.get(typeId)
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
        if (filters.status && filters.status !== 'all' && r.status !== filters.status) {
          return false;
        }

        // Staff filter
        if (filters.staffId && r.staffId !== filters.staffId) {
          return false;
        }

        // Type filter
        if (filters.typeId && r.typeId !== filters.typeId) {
          return false;
        }

        // Date range filter
        if (filters.dateRange === 'upcoming' && r.startDate < today) {
          return false;
        }
        if (filters.dateRange === 'past' && r.startDate >= today) {
          return false;
        }
        // Custom date range
        if (typeof filters.dateRange === 'object' && filters.dateRange !== null) {
          const { start, end } = filters.dateRange;
          if (r.endDate < start || r.startDate > end) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
);

/**
 * Pending requests only, sorted by creation date
 */
export const selectPendingTimeOffRequests = createSelector(
  [selectTimeOffRequests],
  (requests): TimeOffRequest[] =>
    requests
      .filter(r => !r.isDeleted && r.status === 'pending')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
);

/**
 * Approved requests only
 */
export const selectApprovedTimeOffRequests = createSelector(
  [selectTimeOffRequests],
  (requests): TimeOffRequest[] =>
    requests
      .filter(r => !r.isDeleted && r.status === 'approved')
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
);

/**
 * Factory selector: Requests by staff ID
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
 * Factory selector: Approved time-off for a date range (for calendar display)
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
 * Factory selector: Approved time-off for a specific staff member in a date range
 */
export const makeSelectStaffApprovedTimeOffForDateRange = () =>
  createSelector(
    [
      selectTimeOffRequests,
      (_state: RootState, staffId: string) => staffId,
      (_state: RootState, _staffId: string, startDate: string) => startDate,
      (_state: RootState, _staffId: string, _startDate: string, endDate: string) => endDate,
    ],
    (requests, staffId, startDate, endDate): TimeOffRequest[] =>
      requests.filter(r =>
        !r.isDeleted &&
        r.status === 'approved' &&
        r.staffId === staffId &&
        r.endDate >= startDate &&
        r.startDate <= endDate
      )
  );

/**
 * Check if time-off types data needs refresh (stale after 5 minutes)
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
 * Check if time-off requests data needs refresh (stale after 2 minutes)
 */
export const selectTimeOffRequestsNeedsRefresh = createSelector(
  [selectTimeOffRequestsLastFetched],
  (lastFetched): boolean => {
    if (!lastFetched) return true;
    const staleTime = 2 * 60 * 1000; // 2 minutes
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
    approved: number;
    denied: number;
    cancelled: number;
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
      approved: byStatus.approved.length,
      denied: byStatus.denied.length,
      cancelled: byStatus.cancelled.length,
      approvedThisMonth,
      totalThisMonth,
    };
  }
);

/**
 * Get selected time-off type (for edit modal)
 */
export const selectSelectedTimeOffType = createSelector(
  [selectTimeOffTypesMap, selectSelectedTimeOffTypeId],
  (typesMap, selectedId): TimeOffType | undefined =>
    selectedId ? typesMap.get(selectedId) : undefined
);

/**
 * Get selected time-off request (for approval modal)
 */
export const selectSelectedTimeOffRequest = createSelector(
  [selectTimeOffRequests, selectSelectedRequestId],
  (requests, selectedId): TimeOffRequest | undefined =>
    selectedId ? requests.find(r => r.id === selectedId && !r.isDeleted) : undefined
);

/**
 * Check if any schedule data is loading
 */
export const selectScheduleLoading = createSelector(
  [selectTimeOffTypesLoading, selectTimeOffRequestsLoading],
  (typesLoading, requestsLoading): boolean => typesLoading || requestsLoading
);

/**
 * Get any schedule error
 */
export const selectScheduleError = createSelector(
  [selectTimeOffTypesError, selectTimeOffRequestsError, selectBlockedTimeTypesError, selectBlockedTimeEntriesError],
  (typesError, requestsError, blockedTypesError, blockedEntriesError): string | null =>
    typesError || requestsError || blockedTypesError || blockedEntriesError
);

// ==================== BLOCKED TIME TYPE MEMOIZED SELECTORS ====================

/**
 * Active blocked time types, sorted by displayOrder
 */
export const selectActiveBlockedTimeTypes = createSelector(
  [selectBlockedTimeTypes],
  (types): BlockedTimeType[] =>
    types
      .filter(t => t.isActive && !t.isDeleted)
      .sort((a, b) => a.displayOrder - b.displayOrder)
);

/**
 * All blocked time types including inactive, sorted by displayOrder
 */
export const selectAllBlockedTimeTypesSorted = createSelector(
  [selectBlockedTimeTypes],
  (types): BlockedTimeType[] =>
    types
      .filter(t => !t.isDeleted)
      .sort((a, b) => a.displayOrder - b.displayOrder)
);

/**
 * Blocked time types as a lookup map for O(1) access
 */
export const selectBlockedTimeTypesMap = createSelector(
  [selectBlockedTimeTypes],
  (types): Map<string, BlockedTimeType> =>
    new Map(types.filter(t => !t.isDeleted).map(t => [t.id, t]))
);

/**
 * Get a specific blocked time type by ID
 */
export const makeSelectBlockedTimeTypeById = () =>
  createSelector(
    [selectBlockedTimeTypesMap, (_state: RootState, typeId: string) => typeId],
    (typesMap, typeId): BlockedTimeType | undefined => typesMap.get(typeId)
  );

/**
 * Check if blocked time types data needs refresh (stale after 5 minutes)
 */
export const selectBlockedTimeTypesNeedsRefresh = createSelector(
  [selectBlockedTimeTypesLastFetched],
  (lastFetched): boolean => {
    if (!lastFetched) return true;
    const staleTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() - new Date(lastFetched).getTime() > staleTime;
  }
);

/**
 * Get selected blocked time type (for edit modal)
 */
export const selectSelectedBlockedTimeType = createSelector(
  [selectBlockedTimeTypesMap, selectSelectedBlockedTimeTypeId],
  (typesMap, selectedId): BlockedTimeType | undefined =>
    selectedId ? typesMap.get(selectedId) : undefined
);

// ==================== BLOCKED TIME ENTRY MEMOIZED SELECTORS ====================

/**
 * Filtered blocked time entries based on current filter state
 */
export const selectFilteredBlockedTimeEntries = createSelector(
  [selectBlockedTimeEntries, selectBlockedTimeFilters],
  (entries, filters): BlockedTimeEntry[] => {
    return entries
      .filter(e => {
        if (e.isDeleted) return false;

        // Staff filter
        if (filters.staffId && e.staffId !== filters.staffId) {
          return false;
        }

        // Type filter
        if (filters.typeId && e.typeId !== filters.typeId) {
          return false;
        }

        // Date range filter
        if (filters.startDate && e.endDateTime < filters.startDate) {
          return false;
        }
        if (filters.endDate && e.startDateTime > filters.endDate) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
  }
);

/**
 * Check if blocked time entries data needs refresh (stale after 2 minutes)
 */
export const selectBlockedTimeEntriesNeedsRefresh = createSelector(
  [selectBlockedTimeEntriesLastFetched],
  (lastFetched): boolean => {
    if (!lastFetched) return true;
    const staleTime = 2 * 60 * 1000; // 2 minutes
    return Date.now() - new Date(lastFetched).getTime() > staleTime;
  }
);

/**
 * Factory selector: Blocked time entries for a specific staff member
 */
export const makeSelectBlockedTimeEntriesByStaff = () =>
  createSelector(
    [selectBlockedTimeEntries, (_state: RootState, staffId: string) => staffId],
    (entries, staffId): BlockedTimeEntry[] =>
      entries
        .filter(e => e.staffId === staffId && !e.isDeleted)
        .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime))
  );

/**
 * Factory selector: Blocked time for a date range (for calendar display)
 */
export const makeSelectBlockedTimeForDateRange = () =>
  createSelector(
    [
      selectBlockedTimeEntries,
      (_state: RootState, startDate: string) => startDate,
      (_state: RootState, _startDate: string, endDate: string) => endDate,
    ],
    (entries, startDate, endDate): BlockedTimeEntry[] =>
      entries.filter(e =>
        !e.isDeleted &&
        e.endDateTime >= startDate &&
        e.startDateTime <= endDate
      )
  );

/**
 * Factory selector: Blocked time for a specific staff on a specific date
 */
export const makeSelectStaffBlockedTimeForDate = () =>
  createSelector(
    [
      selectBlockedTimeEntries,
      (_state: RootState, staffId: string) => staffId,
      (_state: RootState, _staffId: string, date: string) => date,
    ],
    (entries, staffId, date): BlockedTimeEntry[] => {
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;
      return entries.filter(e =>
        !e.isDeleted &&
        e.staffId === staffId &&
        e.endDateTime >= startOfDay &&
        e.startDateTime <= endOfDay
      ).sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
    }
  );

/**
 * Factory selector: Blocked time for a staff in a date range
 */
export const makeSelectStaffBlockedTimeForDateRange = () =>
  createSelector(
    [
      selectBlockedTimeEntries,
      (_state: RootState, staffId: string) => staffId,
      (_state: RootState, _staffId: string, startDate: string) => startDate,
      (_state: RootState, _staffId: string, _startDate: string, endDate: string) => endDate,
    ],
    (entries, staffId, startDate, endDate): BlockedTimeEntry[] =>
      entries.filter(e =>
        !e.isDeleted &&
        e.staffId === staffId &&
        e.endDateTime >= startDate &&
        e.startDateTime <= endDate
      ).sort((a, b) => a.startDateTime.localeCompare(b.startDateTime))
  );

/**
 * Get selected blocked time entry (for edit modal)
 */
export const selectSelectedBlockedTimeEntry = createSelector(
  [selectBlockedTimeEntries, selectSelectedBlockedTimeEntryId],
  (entries, selectedId): BlockedTimeEntry | undefined =>
    selectedId ? entries.find(e => e.id === selectedId && !e.isDeleted) : undefined
);

/**
 * Check if any blocked time data is loading
 */
export const selectBlockedTimeLoading = createSelector(
  [selectBlockedTimeTypesLoading, selectBlockedTimeEntriesLoading],
  (typesLoading, entriesLoading): boolean => typesLoading || entriesLoading
);

/**
 * Updated schedule loading to include blocked time
 */
export const selectAllScheduleLoading = createSelector(
  [selectScheduleLoading, selectBlockedTimeLoading],
  (scheduleLoading, blockedLoading): boolean => scheduleLoading || blockedLoading
);

// ==================== BUSINESS CLOSED PERIODS MEMOIZED SELECTORS ====================

/**
 * All closed periods, sorted by start date (upcoming first)
 */
export const selectAllClosedPeriodsSorted = createSelector(
  [selectClosedPeriods],
  (periods): BusinessClosedPeriod[] =>
    periods
      .filter(p => !p.isDeleted)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
);

/**
 * Upcoming closed periods (starting today or in the future)
 */
export const selectUpcomingClosedPeriods = createSelector(
  [selectClosedPeriods],
  (periods): BusinessClosedPeriod[] => {
    const today = new Date().toISOString().split('T')[0];
    return periods
      .filter(p => !p.isDeleted && p.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
);

/**
 * Past closed periods (ended before today)
 */
export const selectPastClosedPeriods = createSelector(
  [selectClosedPeriods],
  (periods): BusinessClosedPeriod[] => {
    const today = new Date().toISOString().split('T')[0];
    return periods
      .filter(p => !p.isDeleted && p.endDate < today)
      .sort((a, b) => b.startDate.localeCompare(a.startDate)); // Most recent first
  }
);

/**
 * Check if closed periods data needs refresh (stale after 5 minutes)
 */
export const selectClosedPeriodsNeedsRefresh = createSelector(
  [selectClosedPeriodsLastFetched],
  (lastFetched): boolean => {
    if (!lastFetched) return true;
    const staleTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() - new Date(lastFetched).getTime() > staleTime;
  }
);

/**
 * Closed periods as a lookup map for O(1) access
 */
export const selectClosedPeriodsMap = createSelector(
  [selectClosedPeriods],
  (periods): Map<string, BusinessClosedPeriod> =>
    new Map(periods.filter(p => !p.isDeleted).map(p => [p.id, p]))
);

/**
 * Get selected closed period (for edit modal)
 */
export const selectSelectedClosedPeriod = createSelector(
  [selectClosedPeriodsMap, selectSelectedClosedPeriodId],
  (periodsMap, selectedId): BusinessClosedPeriod | undefined =>
    selectedId ? periodsMap.get(selectedId) : undefined
);

/**
 * Factory selector: Closed periods for a date range (for calendar display)
 */
export const makeSelectClosedPeriodsForDateRange = () =>
  createSelector(
    [
      selectClosedPeriods,
      (_state: RootState, startDate: string) => startDate,
      (_state: RootState, _startDate: string, endDate: string) => endDate,
    ],
    (periods, startDate, endDate): BusinessClosedPeriod[] =>
      periods.filter(p =>
        !p.isDeleted &&
        p.endDate >= startDate &&
        p.startDate <= endDate
      )
  );

/**
 * Factory selector: Check if a specific date is within a closed period
 */
export const makeSelectIsDateClosed = () =>
  createSelector(
    [
      selectClosedPeriods,
      (_state: RootState, date: string) => date,
      (_state: RootState, _date: string, locationId?: string) => locationId,
    ],
    (periods, date, locationId): boolean =>
      periods.some(p => {
        if (p.isDeleted) return false;
        if (p.startDate > date || p.endDate < date) return false;
        if (p.appliesToAllLocations) return true;
        if (!locationId) return true; // If no location specified, any closure counts
        return p.locationIds.includes(locationId);
      })
  );

/**
 * Factory selector: Get closed period for a specific date (if any)
 */
export const makeSelectClosedPeriodForDate = () =>
  createSelector(
    [
      selectClosedPeriods,
      (_state: RootState, date: string) => date,
      (_state: RootState, _date: string, locationId?: string) => locationId,
    ],
    (periods, date, locationId): BusinessClosedPeriod | undefined =>
      periods.find(p => {
        if (p.isDeleted) return false;
        if (p.startDate > date || p.endDate < date) return false;
        if (p.appliesToAllLocations) return true;
        if (!locationId) return true;
        return p.locationIds.includes(locationId);
      })
  );
