import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type {
  TimesheetEntry,
  TimesheetStatus,
  AttendanceAlert,
  OvertimeSettings,
  ClockInParams,
  ClockOutParams,
  StartBreakParams,
  EndBreakParams,
  CreateTimesheetParams,
} from '../../types/timesheet';
import { DEFAULT_OVERTIME_SETTINGS } from '../../types/timesheet';

// ============================================
// SYNC CONTEXT - Required for all mutations
// ============================================

export interface SyncContext {
  userId: string;
  deviceId: string;
  storeId: string;
}

// Default sync context for development/demo
const getDefaultSyncContext = (): SyncContext => ({
  userId: 'system',
  deviceId: typeof window !== 'undefined' ? `device-${window.navigator.userAgent.slice(0, 10)}` : 'server',
  storeId: 'default-store',
});

// ============================================
// STATE TYPES
// ============================================

export interface TimesheetUIState {
  selectedDate: string; // YYYY-MM-DD
  selectedStaffId: string | null;
  viewMode: 'day' | 'week' | 'period';
  filterStatus: TimesheetStatus | 'all';
  showOnlyPending: boolean;
  isClockModalOpen: boolean;
  isBreakModalOpen: boolean;
  isApprovalModalOpen: boolean;
}

export interface TimesheetSyncState {
  lastSyncAt: string | null;
  pendingChanges: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  syncError: string | null;
}

export interface StaffShiftStatus {
  staffId: string;
  isClockedIn: boolean;
  isOnBreak: boolean;
  clockInTime: string | null;
  currentBreakStart: string | null;
  totalWorkedMinutes: number;
  totalBreakMinutes: number;
}

export interface TimesheetState {
  // Data (normalized by timesheet ID)
  timesheets: Record<string, TimesheetEntry>;
  timesheetIds: string[];

  // Staff shift statuses (real-time status for clocked-in staff)
  shiftStatuses: Record<string, StaffShiftStatus>;

  // Attendance alerts
  alerts: AttendanceAlert[];
  unreadAlertCount: number;

  // Settings
  overtimeSettings: OvertimeSettings;

  // Loading states
  loading: boolean;
  loadingStaffId: string | null;
  error: string | null;

  // UI State
  ui: TimesheetUIState;

  // Sync State
  sync: TimesheetSyncState;
}

// ============================================
// INITIAL STATE
// ============================================

const today = new Date().toISOString().split('T')[0];

const initialUIState: TimesheetUIState = {
  selectedDate: today,
  selectedStaffId: null,
  viewMode: 'day',
  filterStatus: 'all',
  showOnlyPending: false,
  isClockModalOpen: false,
  isBreakModalOpen: false,
  isApprovalModalOpen: false,
};

const initialSyncState: TimesheetSyncState = {
  lastSyncAt: null,
  pendingChanges: 0,
  syncStatus: 'idle',
  syncError: null,
};

const initialState: TimesheetState = {
  timesheets: {},
  timesheetIds: [],
  shiftStatuses: {},
  alerts: [],
  unreadAlertCount: 0,
  overtimeSettings: DEFAULT_OVERTIME_SETTINGS,
  loading: false,
  loadingStaffId: null,
  error: null,
  ui: initialUIState,
  sync: initialSyncState,
};

// ============================================
// ASYNC THUNKS
// ============================================

// Fetch timesheets for a date
export const fetchTimesheetsByDate = createAsyncThunk(
  'timesheet/fetchByDate',
  async ({ storeId, date }: { storeId: string; date: string }, { rejectWithValue }) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const timesheets = await timesheetDB.getTimesheetsByDate(storeId, date);
      return { date, timesheets };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch timesheets');
    }
  }
);

// Fetch timesheets for a date range
export const fetchTimesheetsByDateRange = createAsyncThunk(
  'timesheet/fetchByDateRange',
  async (
    { storeId, startDate, endDate }: { storeId: string; startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const timesheets = await timesheetDB.getTimesheetsByDateRange(storeId, startDate, endDate);
      return timesheets;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch timesheets');
    }
  }
);

// Fetch timesheets for a staff member
export const fetchTimesheetsByStaff = createAsyncThunk(
  'timesheet/fetchByStaff',
  async ({ storeId, staffId }: { storeId: string; staffId: string }, { rejectWithValue }) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const timesheets = await timesheetDB.getTimesheetsByStaff(storeId, staffId);
      return { staffId, timesheets };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch timesheets');
    }
  }
);

// Fetch pending timesheets for approval
export const fetchPendingTimesheets = createAsyncThunk(
  'timesheet/fetchPending',
  async (storeId: string, { rejectWithValue }) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const timesheets = await timesheetDB.getPendingTimesheets(storeId);
      return timesheets;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch pending timesheets');
    }
  }
);

// Clock in
export const clockIn = createAsyncThunk(
  'timesheet/clockIn',
  async (
    { params, context }: { params: ClockInParams; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const ctx = context || getDefaultSyncContext();
      const timesheet = await timesheetDB.clockIn(params, ctx.storeId, ctx.userId, ctx.deviceId);
      return timesheet;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to clock in');
    }
  }
);

// Clock out
export const clockOut = createAsyncThunk(
  'timesheet/clockOut',
  async (
    { params, context }: { params: ClockOutParams; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const ctx = context || getDefaultSyncContext();
      const timesheet = await timesheetDB.clockOut(params, ctx.storeId, ctx.userId, ctx.deviceId);
      return timesheet;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to clock out');
    }
  }
);

// Start break
export const startBreak = createAsyncThunk(
  'timesheet/startBreak',
  async (
    { params, context }: { params: StartBreakParams; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const ctx = context || getDefaultSyncContext();
      const timesheet = await timesheetDB.startBreak(params, ctx.storeId, ctx.userId, ctx.deviceId);
      return timesheet;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to start break');
    }
  }
);

// End break
export const endBreak = createAsyncThunk(
  'timesheet/endBreak',
  async (
    { params, context }: { params: EndBreakParams; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const ctx = context || getDefaultSyncContext();
      const timesheet = await timesheetDB.endBreak(params, ctx.storeId, ctx.userId, ctx.deviceId);
      return timesheet;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to end break');
    }
  }
);

// Approve timesheet
export const approveTimesheet = createAsyncThunk(
  'timesheet/approve',
  async (
    { timesheetId, context }: { timesheetId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const ctx = context || getDefaultSyncContext();
      const timesheet = await timesheetDB.approveTimesheet(timesheetId, ctx.userId, ctx.deviceId);
      return timesheet;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to approve timesheet');
    }
  }
);

// Bulk approve timesheets
export const bulkApproveTimesheets = createAsyncThunk(
  'timesheet/bulkApprove',
  async (
    { timesheetIds, context }: { timesheetIds: string[]; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const ctx = context || getDefaultSyncContext();
      await timesheetDB.bulkApproveTimesheets(timesheetIds, ctx.userId, ctx.deviceId);
      return timesheetIds;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to approve timesheets');
    }
  }
);

// Dispute timesheet
export const disputeTimesheet = createAsyncThunk(
  'timesheet/dispute',
  async (
    { timesheetId, reason, context }: { timesheetId: string; reason: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const ctx = context || getDefaultSyncContext();
      const timesheet = await timesheetDB.disputeTimesheet(timesheetId, reason, ctx.userId, ctx.deviceId);
      return timesheet;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to dispute timesheet');
    }
  }
);

// Create timesheet (for scheduled shifts)
export const createTimesheet = createAsyncThunk(
  'timesheet/create',
  async (
    { params, context }: { params: CreateTimesheetParams; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const ctx = context || getDefaultSyncContext();
      const id = await timesheetDB.createTimesheet(params, ctx.storeId, ctx.userId, ctx.deviceId);
      const timesheet = await timesheetDB.getTimesheetById(id);
      return timesheet;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create timesheet');
    }
  }
);

// Fetch staff shift status
export const fetchStaffShiftStatus = createAsyncThunk(
  'timesheet/fetchShiftStatus',
  async ({ storeId, staffId }: { storeId: string; staffId: string }, { rejectWithValue }) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const status = await timesheetDB.getStaffShiftStatus(storeId, staffId);
      return { staffId, status };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch shift status');
    }
  }
);

// Fetch timesheet summary
export const fetchTimesheetSummary = createAsyncThunk(
  'timesheet/fetchSummary',
  async (
    {
      storeId,
      staffId,
      staffName,
      periodStart,
      periodEnd,
    }: {
      storeId: string;
      staffId: string;
      staffName: string;
      periodStart: string;
      periodEnd: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { timesheetDB } = await import('../../db/timesheetOperations');
      const summary = await timesheetDB.getTimesheetSummary(
        storeId,
        staffId,
        staffName,
        periodStart,
        periodEnd
      );
      return summary;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch summary');
    }
  }
);

// ============================================
// SLICE
// ============================================

const timesheetSlice = createSlice({
  name: 'timesheet',
  initialState,
  reducers: {
    // ---- Timesheet CRUD (local state updates) ----
    setTimesheets: (state, action: PayloadAction<TimesheetEntry[]>) => {
      state.timesheets = {};
      state.timesheetIds = [];
      action.payload.forEach((ts) => {
        state.timesheets[ts.id] = ts;
        state.timesheetIds.push(ts.id);
      });
    },

    addTimesheet: (state, action: PayloadAction<TimesheetEntry>) => {
      const ts = action.payload;
      state.timesheets[ts.id] = ts;
      if (!state.timesheetIds.includes(ts.id)) {
        state.timesheetIds.push(ts.id);
      }
    },

    updateTimesheet: (state, action: PayloadAction<TimesheetEntry>) => {
      const ts = action.payload;
      if (state.timesheets[ts.id]) {
        state.timesheets[ts.id] = ts;
      }
    },

    removeTimesheet: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.timesheets[id];
      state.timesheetIds = state.timesheetIds.filter((tsId) => tsId !== id);
    },

    // ---- Shift Status ----
    setShiftStatus: (state, action: PayloadAction<{ staffId: string; status: StaffShiftStatus }>) => {
      const { staffId, status } = action.payload;
      state.shiftStatuses[staffId] = status;
    },

    clearShiftStatus: (state, action: PayloadAction<string>) => {
      delete state.shiftStatuses[action.payload];
    },

    // ---- Alerts ----
    addAlert: (state, action: PayloadAction<AttendanceAlert>) => {
      state.alerts.unshift(action.payload);
      if (!action.payload.resolved) {
        state.unreadAlertCount += 1;
      }
    },

    resolveAlert: (
      state,
      action: PayloadAction<{ alertId: string; resolvedBy: string; note?: string }>
    ) => {
      const { alertId, resolvedBy, note } = action.payload;
      const alert = state.alerts.find((a) => a.id === alertId);
      if (alert && !alert.resolved) {
        alert.resolved = true;
        alert.resolvedBy = resolvedBy;
        alert.resolvedAt = new Date().toISOString();
        alert.resolutionNote = note;
        state.unreadAlertCount = Math.max(0, state.unreadAlertCount - 1);
      }
    },

    clearAlerts: (state) => {
      state.alerts = [];
      state.unreadAlertCount = 0;
    },

    markAlertsRead: (state) => {
      state.unreadAlertCount = 0;
    },

    // ---- Settings ----
    setOvertimeSettings: (state, action: PayloadAction<OvertimeSettings>) => {
      state.overtimeSettings = action.payload;
    },

    // ---- UI State ----
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.ui.selectedDate = action.payload;
    },

    setSelectedStaffId: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedStaffId = action.payload;
    },

    setViewMode: (state, action: PayloadAction<'day' | 'week' | 'period'>) => {
      state.ui.viewMode = action.payload;
    },

    setFilterStatus: (state, action: PayloadAction<TimesheetStatus | 'all'>) => {
      state.ui.filterStatus = action.payload;
    },

    setShowOnlyPending: (state, action: PayloadAction<boolean>) => {
      state.ui.showOnlyPending = action.payload;
    },

    setClockModalOpen: (state, action: PayloadAction<boolean>) => {
      state.ui.isClockModalOpen = action.payload;
    },

    setBreakModalOpen: (state, action: PayloadAction<boolean>) => {
      state.ui.isBreakModalOpen = action.payload;
    },

    setApprovalModalOpen: (state, action: PayloadAction<boolean>) => {
      state.ui.isApprovalModalOpen = action.payload;
    },

    // ---- Error handling ----
    clearError: (state) => {
      state.error = null;
    },

    // ---- Sync state ----
    setSyncStatus: (state, action: PayloadAction<'idle' | 'syncing' | 'error'>) => {
      state.sync.syncStatus = action.payload;
    },

    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.sync.syncError = action.payload;
    },

    setLastSyncAt: (state, action: PayloadAction<string>) => {
      state.sync.lastSyncAt = action.payload;
    },

    incrementPendingChanges: (state) => {
      state.sync.pendingChanges += 1;
    },

    decrementPendingChanges: (state) => {
      state.sync.pendingChanges = Math.max(0, state.sync.pendingChanges - 1);
    },
  },
  extraReducers: (builder) => {
    // Fetch timesheets by date
    builder
      .addCase(fetchTimesheetsByDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimesheetsByDate.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.timesheets.forEach((ts) => {
          state.timesheets[ts.id] = ts;
          if (!state.timesheetIds.includes(ts.id)) {
            state.timesheetIds.push(ts.id);
          }
        });
      })
      .addCase(fetchTimesheetsByDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch timesheets by date range
    builder
      .addCase(fetchTimesheetsByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimesheetsByDateRange.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach((ts) => {
          state.timesheets[ts.id] = ts;
          if (!state.timesheetIds.includes(ts.id)) {
            state.timesheetIds.push(ts.id);
          }
        });
      })
      .addCase(fetchTimesheetsByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch timesheets by staff
    builder
      .addCase(fetchTimesheetsByStaff.pending, (state, action) => {
        state.loadingStaffId = action.meta.arg.staffId;
        state.error = null;
      })
      .addCase(fetchTimesheetsByStaff.fulfilled, (state, action) => {
        state.loadingStaffId = null;
        action.payload.timesheets.forEach((ts) => {
          state.timesheets[ts.id] = ts;
          if (!state.timesheetIds.includes(ts.id)) {
            state.timesheetIds.push(ts.id);
          }
        });
      })
      .addCase(fetchTimesheetsByStaff.rejected, (state, action) => {
        state.loadingStaffId = null;
        state.error = action.payload as string;
      });

    // Fetch pending timesheets
    builder
      .addCase(fetchPendingTimesheets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingTimesheets.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach((ts) => {
          state.timesheets[ts.id] = ts;
          if (!state.timesheetIds.includes(ts.id)) {
            state.timesheetIds.push(ts.id);
          }
        });
      })
      .addCase(fetchPendingTimesheets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Clock in
    builder
      .addCase(clockIn.pending, (state, action) => {
        state.loadingStaffId = action.meta.arg.params.staffId;
        state.error = null;
      })
      .addCase(clockIn.fulfilled, (state, action) => {
        state.loadingStaffId = null;
        const ts = action.payload;
        state.timesheets[ts.id] = ts;
        if (!state.timesheetIds.includes(ts.id)) {
          state.timesheetIds.push(ts.id);
        }
        // Update shift status
        state.shiftStatuses[ts.staffId] = {
          staffId: ts.staffId,
          isClockedIn: true,
          isOnBreak: false,
          clockInTime: ts.actualClockIn,
          currentBreakStart: null,
          totalWorkedMinutes: 0,
          totalBreakMinutes: 0,
        };
      })
      .addCase(clockIn.rejected, (state, action) => {
        state.loadingStaffId = null;
        state.error = action.payload as string;
      });

    // Clock out
    builder
      .addCase(clockOut.pending, (state, action) => {
        state.loadingStaffId = action.meta.arg.params.staffId;
        state.error = null;
      })
      .addCase(clockOut.fulfilled, (state, action) => {
        state.loadingStaffId = null;
        const ts = action.payload;
        state.timesheets[ts.id] = ts;
        // Update shift status
        state.shiftStatuses[ts.staffId] = {
          staffId: ts.staffId,
          isClockedIn: false,
          isOnBreak: false,
          clockInTime: null,
          currentBreakStart: null,
          totalWorkedMinutes: ts.hours.actualHours * 60,
          totalBreakMinutes: ts.hours.breakMinutes,
        };
      })
      .addCase(clockOut.rejected, (state, action) => {
        state.loadingStaffId = null;
        state.error = action.payload as string;
      });

    // Start break
    builder
      .addCase(startBreak.pending, (state, action) => {
        state.loadingStaffId = action.meta.arg.params.staffId;
        state.error = null;
      })
      .addCase(startBreak.fulfilled, (state, action) => {
        state.loadingStaffId = null;
        const ts = action.payload;
        state.timesheets[ts.id] = ts;
        // Update shift status
        const activeBreak = ts.breaks.find((b) => !b.endTime);
        if (state.shiftStatuses[ts.staffId]) {
          state.shiftStatuses[ts.staffId].isOnBreak = true;
          state.shiftStatuses[ts.staffId].currentBreakStart = activeBreak?.startTime || null;
        }
      })
      .addCase(startBreak.rejected, (state, action) => {
        state.loadingStaffId = null;
        state.error = action.payload as string;
      });

    // End break
    builder
      .addCase(endBreak.pending, (state, action) => {
        state.loadingStaffId = action.meta.arg.params.staffId;
        state.error = null;
      })
      .addCase(endBreak.fulfilled, (state, action) => {
        state.loadingStaffId = null;
        const ts = action.payload;
        state.timesheets[ts.id] = ts;
        // Update shift status
        if (state.shiftStatuses[ts.staffId]) {
          state.shiftStatuses[ts.staffId].isOnBreak = false;
          state.shiftStatuses[ts.staffId].currentBreakStart = null;
          state.shiftStatuses[ts.staffId].totalBreakMinutes = ts.hours.breakMinutes;
        }
      })
      .addCase(endBreak.rejected, (state, action) => {
        state.loadingStaffId = null;
        state.error = action.payload as string;
      });

    // Approve timesheet
    builder
      .addCase(approveTimesheet.fulfilled, (state, action) => {
        const ts = action.payload;
        state.timesheets[ts.id] = ts;
      })
      .addCase(approveTimesheet.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Bulk approve timesheets
    builder
      .addCase(bulkApproveTimesheets.fulfilled, (state, action) => {
        // Mark all as approved (actual data will be refetched)
        action.payload.forEach((id) => {
          if (state.timesheets[id]) {
            state.timesheets[id].status = 'approved';
          }
        });
      })
      .addCase(bulkApproveTimesheets.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Dispute timesheet
    builder
      .addCase(disputeTimesheet.fulfilled, (state, action) => {
        const ts = action.payload;
        state.timesheets[ts.id] = ts;
      })
      .addCase(disputeTimesheet.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Create timesheet
    builder
      .addCase(createTimesheet.fulfilled, (state, action) => {
        if (action.payload) {
          const ts = action.payload;
          state.timesheets[ts.id] = ts;
          if (!state.timesheetIds.includes(ts.id)) {
            state.timesheetIds.push(ts.id);
          }
        }
      })
      .addCase(createTimesheet.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Fetch staff shift status
    builder
      .addCase(fetchStaffShiftStatus.fulfilled, (state, action) => {
        const { staffId, status } = action.payload;
        state.shiftStatuses[staffId] = {
          staffId,
          ...status,
        };
      });
  },
});

// ============================================
// ACTIONS EXPORT
// ============================================

export const {
  setTimesheets,
  addTimesheet,
  updateTimesheet,
  removeTimesheet,
  setShiftStatus,
  clearShiftStatus,
  addAlert,
  resolveAlert,
  clearAlerts,
  markAlertsRead,
  setOvertimeSettings,
  setSelectedDate,
  setSelectedStaffId,
  setViewMode,
  setFilterStatus,
  setShowOnlyPending,
  setClockModalOpen,
  setBreakModalOpen,
  setApprovalModalOpen,
  clearError,
  setSyncStatus,
  setSyncError,
  setLastSyncAt,
  incrementPendingChanges,
  decrementPendingChanges,
} = timesheetSlice.actions;

// ============================================
// SELECTORS
// ============================================

// Basic selectors
export const selectTimesheetState = (state: RootState) => state.timesheet;
export const selectTimesheets = (state: RootState) => state.timesheet.timesheets;
export const selectTimesheetIds = (state: RootState) => state.timesheet.timesheetIds;
export const selectTimesheetLoading = (state: RootState) => state.timesheet.loading;
export const selectTimesheetError = (state: RootState) => state.timesheet.error;
export const selectTimesheetUI = (state: RootState) => state.timesheet.ui;
export const selectTimesheetSync = (state: RootState) => state.timesheet.sync;
export const selectOvertimeSettings = (state: RootState) => state.timesheet.overtimeSettings;
export const selectShiftStatuses = (state: RootState) => state.timesheet.shiftStatuses;
export const selectAlerts = (state: RootState) => state.timesheet.alerts;
export const selectUnreadAlertCount = (state: RootState) => state.timesheet.unreadAlertCount;

// Derived selectors
export const selectAllTimesheets = (state: RootState): TimesheetEntry[] => {
  return state.timesheet.timesheetIds.map((id) => state.timesheet.timesheets[id]).filter(Boolean);
};

export const selectTimesheetById = (state: RootState, id: string): TimesheetEntry | undefined => {
  return state.timesheet.timesheets[id];
};

export const selectTimesheetsByDate = (state: RootState, date: string): TimesheetEntry[] => {
  return selectAllTimesheets(state).filter((ts) => ts.date === date);
};

export const selectTimesheetsByStaff = (state: RootState, staffId: string): TimesheetEntry[] => {
  return selectAllTimesheets(state).filter((ts) => ts.staffId === staffId);
};

export const selectTimesheetByStaffAndDate = (
  state: RootState,
  staffId: string,
  date: string
): TimesheetEntry | undefined => {
  return selectAllTimesheets(state).find((ts) => ts.staffId === staffId && ts.date === date);
};

export const selectPendingTimesheets = (state: RootState): TimesheetEntry[] => {
  return selectAllTimesheets(state).filter((ts) => ts.status === 'pending');
};

export const selectDisputedTimesheets = (state: RootState): TimesheetEntry[] => {
  return selectAllTimesheets(state).filter((ts) => ts.status === 'disputed');
};

export const selectApprovedTimesheets = (state: RootState): TimesheetEntry[] => {
  return selectAllTimesheets(state).filter((ts) => ts.status === 'approved');
};

// Shift status selectors
export const selectStaffShiftStatus = (
  state: RootState,
  staffId: string
): StaffShiftStatus | undefined => {
  return state.timesheet.shiftStatuses[staffId];
};

export const selectClockedInStaff = (state: RootState): string[] => {
  return Object.values(state.timesheet.shiftStatuses)
    .filter((status) => status.isClockedIn)
    .map((status) => status.staffId);
};

export const selectStaffOnBreak = (state: RootState): string[] => {
  return Object.values(state.timesheet.shiftStatuses)
    .filter((status) => status.isOnBreak)
    .map((status) => status.staffId);
};

// UI-filtered selectors
export const selectFilteredTimesheets = (state: RootState): TimesheetEntry[] => {
  const { selectedDate, filterStatus, showOnlyPending } = state.timesheet.ui;
  let timesheets = selectTimesheetsByDate(state, selectedDate);

  if (filterStatus !== 'all') {
    timesheets = timesheets.filter((ts) => ts.status === filterStatus);
  }

  if (showOnlyPending) {
    timesheets = timesheets.filter((ts) => ts.status === 'pending');
  }

  return timesheets;
};

// Alert selectors
export const selectUnresolvedAlerts = (state: RootState): AttendanceAlert[] => {
  return state.timesheet.alerts.filter((a) => !a.resolved);
};

export const selectAlertsByStaff = (state: RootState, staffId: string): AttendanceAlert[] => {
  return state.timesheet.alerts.filter((a) => a.staffId === staffId);
};

// Stats selector
export const selectTimesheetStats = (state: RootState) => {
  const timesheets = selectAllTimesheets(state);
  return {
    total: timesheets.length,
    pending: timesheets.filter((ts) => ts.status === 'pending').length,
    approved: timesheets.filter((ts) => ts.status === 'approved').length,
    disputed: timesheets.filter((ts) => ts.status === 'disputed').length,
  };
};

export default timesheetSlice.reducer;
