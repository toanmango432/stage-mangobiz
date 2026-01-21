/**
 * Schedule Redux Slice
 *
 * State management for Time-Off, Blocked Time, Resources, and Staff Schedules.
 * Thunks are extracted to schedule/scheduleThunks.ts for file size management.
 * Types and initial state are extracted to schedule/types.ts.
 * Selectors are extracted to schedule/scheduleSelectors.ts.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  TimeOffType,
  TimeOffRequest,
  TimeOffRequestFilters,
  BlockedTimeType,
  BlockedTimeEntry,
  BusinessClosedPeriod,
} from '../../types/schedule';

// Import types and initial state from extracted file
import type { ScheduleModalType } from './schedule/types';
import { initialScheduleState } from './schedule/types';

// Import thunks from extracted file
import {
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
  fetchClosedPeriods,
  createClosedPeriod,
  updateClosedPeriod,
  deleteClosedPeriod,
  BlockedTimeFilters,
} from './schedule/scheduleThunks';

// Re-export thunks for consumers
export {
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
  fetchClosedPeriods,
  createClosedPeriod,
  updateClosedPeriod,
  deleteClosedPeriod,
};

// Re-export BlockedTimeFilters type and ScheduleModalType
export type { BlockedTimeFilters };
export type { ScheduleModalType };

// ==================== SLICE ====================

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState: initialScheduleState,
  reducers: {
    // --- Filter Actions ---
    setTimeOffRequestFilters: (state, action: PayloadAction<Partial<TimeOffRequestFilters>>) => {
      state.timeOffRequests.filters = {
        ...state.timeOffRequests.filters,
        ...action.payload,
      };
    },
    resetTimeOffRequestFilters: (state) => {
      state.timeOffRequests.filters = initialScheduleState.timeOffRequests.filters;
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
    openBlockTimeModal: (
      state,
      action: PayloadAction<
        | {
            staffId?: string;
            date?: string;
            startTime?: string;
          }
        | undefined
      >
    ) => {
      state.ui.blockTimeModalOpen = true;
      state.ui.blockTimeModalContext = action.payload
        ? {
            staffId: action.payload.staffId ?? null,
            date: action.payload.date ?? null,
            startTime: action.payload.startTime ?? null,
          }
        : null;
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
      state.blockedTimeEntries.filters = initialScheduleState.blockedTimeEntries.filters;
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
      state.timeOffTypes.items = state.timeOffTypes.items.filter((t) => t.id !== action.payload);
    },
    updateTimeOffTypeOptimistic: (state, action: PayloadAction<TimeOffType>) => {
      const index = state.timeOffTypes.items.findIndex((t) => t.id === action.payload.id);
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
      const request = state.timeOffRequests.items.find((r) => r.id === action.payload);
      if (request?.status === 'pending') {
        state.timeOffRequests.pendingCount -= 1;
      }
      state.timeOffRequests.items = state.timeOffRequests.items.filter(
        (r) => r.id !== action.payload
      );
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
        state.timeOffTypes.error =
          typeof action.payload === 'string'
            ? action.payload
            : (action.payload as { message: string })?.message || 'Create failed';
      })

      .addCase(updateTimeOffType.fulfilled, (state, action) => {
        const index = state.timeOffTypes.items.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.timeOffTypes.items[index] = action.payload;
        }
      })
      .addCase(updateTimeOffType.rejected, (state, action) => {
        state.timeOffTypes.error =
          typeof action.payload === 'string'
            ? action.payload
            : (action.payload as { message: string })?.message || 'Update failed';
      })

      .addCase(deleteTimeOffType.fulfilled, (state, action) => {
        state.timeOffTypes.items = state.timeOffTypes.items.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTimeOffType.rejected, (state, action) => {
        state.timeOffTypes.error =
          typeof action.payload === 'string'
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
        state.timeOffRequests.error =
          typeof action.payload === 'string'
            ? action.payload
            : (action.payload as { message: string })?.message || 'Create failed';
      })

      .addCase(approveTimeOffRequest.fulfilled, (state, action) => {
        const index = state.timeOffRequests.items.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          const wasPending = state.timeOffRequests.items[index].status === 'pending';
          state.timeOffRequests.items[index] = action.payload;
          if (wasPending) {
            state.timeOffRequests.pendingCount = Math.max(
              0,
              state.timeOffRequests.pendingCount - 1
            );
          }
        }
      })

      .addCase(denyTimeOffRequest.fulfilled, (state, action) => {
        const index = state.timeOffRequests.items.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          const wasPending = state.timeOffRequests.items[index].status === 'pending';
          state.timeOffRequests.items[index] = action.payload;
          if (wasPending) {
            state.timeOffRequests.pendingCount = Math.max(
              0,
              state.timeOffRequests.pendingCount - 1
            );
          }
        }
      })

      .addCase(cancelTimeOffRequest.fulfilled, (state, action) => {
        const index = state.timeOffRequests.items.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          const wasPending = state.timeOffRequests.items[index].status === 'pending';
          state.timeOffRequests.items[index] = action.payload;
          if (wasPending) {
            state.timeOffRequests.pendingCount = Math.max(
              0,
              state.timeOffRequests.pendingCount - 1
            );
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
        state.blockedTimeTypes.error =
          typeof action.payload === 'string'
            ? action.payload
            : (action.payload as { message: string })?.message || 'Create failed';
      })

      .addCase(updateBlockedTimeType.fulfilled, (state, action) => {
        const index = state.blockedTimeTypes.items.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.blockedTimeTypes.items[index] = action.payload;
        }
      })
      .addCase(updateBlockedTimeType.rejected, (state, action) => {
        state.blockedTimeTypes.error =
          typeof action.payload === 'string'
            ? action.payload
            : (action.payload as { message: string })?.message || 'Update failed';
      })

      .addCase(deleteBlockedTimeType.fulfilled, (state, action) => {
        state.blockedTimeTypes.items = state.blockedTimeTypes.items.filter(
          (t) => t.id !== action.payload
        );
      })
      .addCase(deleteBlockedTimeType.rejected, (state, action) => {
        state.blockedTimeTypes.error =
          typeof action.payload === 'string'
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
        state.blockedTimeEntries.error =
          typeof action.payload === 'string'
            ? action.payload
            : (action.payload as { message: string })?.message || 'Create failed';
      })

      .addCase(deleteBlockedTimeEntry.fulfilled, (state, action) => {
        state.blockedTimeEntries.items = state.blockedTimeEntries.items.filter(
          (e) => e.id !== action.payload
        );
      })
      .addCase(deleteBlockedTimeEntry.rejected, (state, action) => {
        state.blockedTimeEntries.error =
          typeof action.payload === 'string' ? action.payload : 'Delete failed';
      })

      .addCase(deleteBlockedTimeSeries.fulfilled, (state, action) => {
        state.blockedTimeEntries.items = state.blockedTimeEntries.items.filter(
          (e) => e.seriesId !== action.payload.seriesId
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
        const index = state.closedPeriods.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.closedPeriods.items[index] = action.payload;
        }
      })
      .addCase(updateClosedPeriod.rejected, (state, action) => {
        state.closedPeriods.error = action.payload as string;
      })

      .addCase(deleteClosedPeriod.fulfilled, (state, action) => {
        state.closedPeriods.items = state.closedPeriods.items.filter((p) => p.id !== action.payload);
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
