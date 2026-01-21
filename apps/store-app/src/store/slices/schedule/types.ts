/**
 * Schedule Slice Types
 *
 * Type definitions for the schedule Redux slice state.
 */

import type {
  TimeOffType,
  TimeOffRequest,
  TimeOffRequestFilters,
  BlockedTimeType,
  BlockedTimeEntry,
  BusinessClosedPeriod,
} from '../../../types/schedule';
import type { BlockedTimeFilters } from './scheduleThunks';

// ==================== MODAL TYPES ====================

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

// ==================== STATE INTERFACE ====================

export interface ScheduleState {
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

// ==================== INITIAL STATE ====================

export const initialScheduleState: ScheduleState = {
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
