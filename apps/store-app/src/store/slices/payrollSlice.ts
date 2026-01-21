import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type {
  PayRun,
  PayRunStatus,
  StaffPayment,
  CreatePayRunParams,
  AddAdjustmentParams,
} from '../../types/payroll';
import { SyncContext, getDefaultSyncContext } from '../utils/syncContext';

// ============================================
// STATE TYPES
// ============================================

export interface PayrollUIState {
  selectedPayRunId: string | null;
  filterStatus: PayRunStatus | 'all';
  sortBy: 'periodStart' | 'status' | 'grandTotal';
  sortOrder: 'asc' | 'desc';
  isCreateModalOpen: boolean;
  isDetailModalOpen: boolean;
}

export interface PayrollState {
  // Data (normalized by pay run ID)
  payRuns: Record<string, PayRun>;
  payRunIds: string[];

  // Loading states
  loading: boolean;
  submitting: boolean;
  error: string | null;

  // UI State
  ui: PayrollUIState;
}

// ============================================
// INITIAL STATE
// ============================================

const initialUIState: PayrollUIState = {
  selectedPayRunId: null,
  filterStatus: 'all',
  sortBy: 'periodStart',
  sortOrder: 'desc',
  isCreateModalOpen: false,
  isDetailModalOpen: false,
};

const initialState: PayrollState = {
  payRuns: {},
  payRunIds: [],
  loading: false,
  submitting: false,
  error: null,
  ui: initialUIState,
};

// ============================================
// ASYNC THUNKS
// ============================================

// Fetch all pay runs for a store
export const fetchPayRuns = createAsyncThunk(
  'payroll/fetchAll',
  async (storeId: string, { rejectWithValue }) => {
    try {
      const { payrollDB } = await import('../../db/payrollOperations');
      const payRuns = await payrollDB.getAllPayRuns(storeId);
      return payRuns;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch pay runs');
    }
  }
);

// Fetch pay runs by date range
export const fetchPayRunsByDateRange = createAsyncThunk(
  'payroll/fetchByDateRange',
  async (
    { storeId, startDate, endDate }: { storeId: string; startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      const { payrollDB } = await import('../../db/payrollOperations');
      const payRuns = await payrollDB.getPayRunsByDateRange(storeId, startDate, endDate);
      return payRuns;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch pay runs');
    }
  }
);

// Fetch pay runs by status
export const fetchPayRunsByStatus = createAsyncThunk(
  'payroll/fetchByStatus',
  async (
    { storeId, status }: { storeId: string; status: PayRunStatus },
    { rejectWithValue }
  ) => {
    try {
      const { payrollDB } = await import('../../db/payrollOperations');
      const payRuns = await payrollDB.getPayRunsByStatus(storeId, status);
      return payRuns;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch pay runs');
    }
  }
);

// Create a new pay run
export const createPayRun = createAsyncThunk(
  'payroll/create',
  async (
    { params, context }: { params: CreatePayRunParams; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { payrollDB } = await import('../../db/payrollOperations');
      const ctx = context || getDefaultSyncContext();
      const id = await payrollDB.createPayRun(
        params,
        ctx.storeId || 'default-store',
        ctx.userId,
        ctx.deviceId,
        ctx.tenantId
      );
      const payRun = await payrollDB.getPayRunById(id);
      return payRun;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create pay run');
    }
  }
);

// Update staff payment in pay run
export const updateStaffPayment = createAsyncThunk(
  'payroll/updateStaffPayment',
  async (
    {
      payRunId,
      staffPayment,
      context,
    }: { payRunId: string; staffPayment: StaffPayment; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { payrollDB } = await import('../../db/payrollOperations');
      const ctx = context || getDefaultSyncContext();
      const payRun = await payrollDB.upsertStaffPayment(
        payRunId,
        staffPayment,
        ctx.userId,
        ctx.deviceId
      );
      return payRun;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update staff payment');
    }
  }
);

// Add adjustment to staff payment
export const addAdjustment = createAsyncThunk(
  'payroll/addAdjustment',
  async (
    { params, context }: { params: AddAdjustmentParams; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { payrollDB } = await import('../../db/payrollOperations');
      const ctx = context || getDefaultSyncContext();
      const payRun = await payrollDB.addAdjustment(params, ctx.userId, ctx.deviceId);
      return payRun;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add adjustment');
    }
  }
);

// Remove adjustment from staff payment
export const removeAdjustment = createAsyncThunk(
  'payroll/removeAdjustment',
  async (
    {
      payRunId,
      staffId,
      adjustmentId,
      context,
    }: { payRunId: string; staffId: string; adjustmentId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { payrollDB } = await import('../../db/payrollOperations');
      const ctx = context || getDefaultSyncContext();
      const payRun = await payrollDB.removeAdjustment(
        payRunId,
        staffId,
        adjustmentId,
        ctx.userId,
        ctx.deviceId
      );
      return payRun;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove adjustment');
    }
  }
);

// Submit pay run for approval
export const submitPayRunForApproval = createAsyncThunk(
  'payroll/submitForApproval',
  async (
    { payRunId, context }: { payRunId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { payrollDB } = await import('../../db/payrollOperations');
      const ctx = context || getDefaultSyncContext();
      const payRun = await payrollDB.submitForApproval(payRunId, ctx.userId, ctx.deviceId);
      return payRun;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to submit pay run');
    }
  }
);

// Approve pay run
export const approvePayRun = createAsyncThunk(
  'payroll/approve',
  async (
    {
      payRunId,
      approvalNotes,
      context,
    }: { payRunId: string; approvalNotes?: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { payrollDB } = await import('../../db/payrollOperations');
      const ctx = context || getDefaultSyncContext();
      const payRun = await payrollDB.approvePayRun(
        payRunId,
        approvalNotes,
        ctx.userId,
        ctx.deviceId
      );
      return payRun;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to approve pay run');
    }
  }
);

// Reject pay run
export const rejectPayRun = createAsyncThunk(
  'payroll/reject',
  async (
    { payRunId, reason, context }: { payRunId: string; reason: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { payrollDB } = await import('../../db/payrollOperations');
      const ctx = context || getDefaultSyncContext();
      const payRun = await payrollDB.rejectPayRun(payRunId, reason, ctx.userId, ctx.deviceId);
      return payRun;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to reject pay run');
    }
  }
);

// Process pay run
export const processPayRun = createAsyncThunk(
  'payroll/process',
  async (
    {
      payRunId,
      processingNotes,
      context,
    }: { payRunId: string; processingNotes?: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { payrollDB } = await import('../../db/payrollOperations');
      const ctx = context || getDefaultSyncContext();
      const payRun = await payrollDB.processPayRun(
        payRunId,
        processingNotes,
        ctx.userId,
        ctx.deviceId
      );
      return payRun;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to process pay run');
    }
  }
);

// Void pay run
export const voidPayRun = createAsyncThunk(
  'payroll/void',
  async (
    { payRunId, reason, context }: { payRunId: string; reason: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { payrollDB } = await import('../../db/payrollOperations');
      const ctx = context || getDefaultSyncContext();
      const payRun = await payrollDB.voidPayRun(payRunId, reason, ctx.userId, ctx.deviceId);
      return payRun;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to void pay run');
    }
  }
);

// Delete pay run
export const deletePayRun = createAsyncThunk(
  'payroll/delete',
  async (
    { payRunId, context }: { payRunId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { payrollDB } = await import('../../db/payrollOperations');
      const ctx = context || getDefaultSyncContext();
      await payrollDB.deletePayRun(payRunId, ctx.userId, ctx.deviceId);
      return payRunId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete pay run');
    }
  }
);

// ============================================
// SLICE
// ============================================

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    // ---- Pay Run CRUD (local state updates) ----
    setPayRuns: (state, action: PayloadAction<PayRun[]>) => {
      state.payRuns = {};
      state.payRunIds = [];
      action.payload.forEach((pr) => {
        state.payRuns[pr.id] = pr;
        state.payRunIds.push(pr.id);
      });
    },

    addPayRun: (state, action: PayloadAction<PayRun>) => {
      const pr = action.payload;
      state.payRuns[pr.id] = pr;
      if (!state.payRunIds.includes(pr.id)) {
        state.payRunIds.push(pr.id);
      }
    },

    updatePayRunLocal: (state, action: PayloadAction<PayRun>) => {
      const pr = action.payload;
      if (state.payRuns[pr.id]) {
        state.payRuns[pr.id] = pr;
      }
    },

    removePayRun: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.payRuns[id];
      state.payRunIds = state.payRunIds.filter((prId) => prId !== id);
    },

    // ---- UI State ----
    setSelectedPayRunId: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedPayRunId = action.payload;
    },

    setFilterStatus: (state, action: PayloadAction<PayRunStatus | 'all'>) => {
      state.ui.filterStatus = action.payload;
    },

    setSortBy: (state, action: PayloadAction<'periodStart' | 'status' | 'grandTotal'>) => {
      state.ui.sortBy = action.payload;
    },

    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.ui.sortOrder = action.payload;
    },

    setCreateModalOpen: (state, action: PayloadAction<boolean>) => {
      state.ui.isCreateModalOpen = action.payload;
    },

    setDetailModalOpen: (state, action: PayloadAction<boolean>) => {
      state.ui.isDetailModalOpen = action.payload;
    },

    // ---- Error handling ----
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all pay runs
    builder
      .addCase(fetchPayRuns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayRuns.fulfilled, (state, action) => {
        state.loading = false;
        state.payRuns = {};
        state.payRunIds = [];
        action.payload.forEach((pr) => {
          state.payRuns[pr.id] = pr;
          state.payRunIds.push(pr.id);
        });
      })
      .addCase(fetchPayRuns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch by date range
    builder
      .addCase(fetchPayRunsByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayRunsByDateRange.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach((pr) => {
          state.payRuns[pr.id] = pr;
          if (!state.payRunIds.includes(pr.id)) {
            state.payRunIds.push(pr.id);
          }
        });
      })
      .addCase(fetchPayRunsByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch by status
    builder
      .addCase(fetchPayRunsByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayRunsByStatus.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach((pr) => {
          state.payRuns[pr.id] = pr;
          if (!state.payRunIds.includes(pr.id)) {
            state.payRunIds.push(pr.id);
          }
        });
      })
      .addCase(fetchPayRunsByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create pay run
    builder
      .addCase(createPayRun.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createPayRun.fulfilled, (state, action) => {
        state.submitting = false;
        if (action.payload) {
          const pr = action.payload;
          state.payRuns[pr.id] = pr;
          if (!state.payRunIds.includes(pr.id)) {
            state.payRunIds.push(pr.id);
          }
          state.ui.selectedPayRunId = pr.id;
        }
      })
      .addCase(createPayRun.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });

    // Update staff payment
    builder
      .addCase(updateStaffPayment.fulfilled, (state, action) => {
        const pr = action.payload;
        state.payRuns[pr.id] = pr;
      })
      .addCase(updateStaffPayment.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Add adjustment
    builder
      .addCase(addAdjustment.fulfilled, (state, action) => {
        const pr = action.payload;
        state.payRuns[pr.id] = pr;
      })
      .addCase(addAdjustment.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Remove adjustment
    builder
      .addCase(removeAdjustment.fulfilled, (state, action) => {
        const pr = action.payload;
        state.payRuns[pr.id] = pr;
      })
      .addCase(removeAdjustment.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Submit for approval
    builder
      .addCase(submitPayRunForApproval.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitPayRunForApproval.fulfilled, (state, action) => {
        state.submitting = false;
        const pr = action.payload;
        state.payRuns[pr.id] = pr;
      })
      .addCase(submitPayRunForApproval.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });

    // Approve pay run
    builder
      .addCase(approvePayRun.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(approvePayRun.fulfilled, (state, action) => {
        state.submitting = false;
        const pr = action.payload;
        state.payRuns[pr.id] = pr;
      })
      .addCase(approvePayRun.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });

    // Reject pay run
    builder
      .addCase(rejectPayRun.fulfilled, (state, action) => {
        const pr = action.payload;
        state.payRuns[pr.id] = pr;
      })
      .addCase(rejectPayRun.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Process pay run
    builder
      .addCase(processPayRun.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(processPayRun.fulfilled, (state, action) => {
        state.submitting = false;
        const pr = action.payload;
        state.payRuns[pr.id] = pr;
      })
      .addCase(processPayRun.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });

    // Void pay run
    builder
      .addCase(voidPayRun.fulfilled, (state, action) => {
        const pr = action.payload;
        state.payRuns[pr.id] = pr;
      })
      .addCase(voidPayRun.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Delete pay run
    builder
      .addCase(deletePayRun.fulfilled, (state, action) => {
        const id = action.payload;
        delete state.payRuns[id];
        state.payRunIds = state.payRunIds.filter((prId) => prId !== id);
        if (state.ui.selectedPayRunId === id) {
          state.ui.selectedPayRunId = null;
        }
      })
      .addCase(deletePayRun.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// ============================================
// ACTIONS EXPORT
// ============================================

export const {
  setPayRuns,
  addPayRun,
  updatePayRunLocal,
  removePayRun,
  setSelectedPayRunId,
  setFilterStatus,
  setSortBy,
  setSortOrder,
  setCreateModalOpen,
  setDetailModalOpen,
  clearError,
} = payrollSlice.actions;

// ============================================
// SELECTORS
// ============================================

// Basic selectors
export const selectPayrollState = (state: RootState) => state.payroll;
export const selectPayRuns = (state: RootState) => state.payroll.payRuns;
export const selectPayRunIds = (state: RootState) => state.payroll.payRunIds;
export const selectPayrollLoading = (state: RootState) => state.payroll.loading;
export const selectPayrollSubmitting = (state: RootState) => state.payroll.submitting;
export const selectPayrollError = (state: RootState) => state.payroll.error;
export const selectPayrollUI = (state: RootState) => state.payroll.ui;

// Derived selectors
export const selectAllPayRuns = (state: RootState): PayRun[] => {
  return state.payroll.payRunIds.map((id) => state.payroll.payRuns[id]).filter(Boolean);
};

export const selectPayRunById = (state: RootState, id: string): PayRun | undefined => {
  return state.payroll.payRuns[id];
};

export const selectSelectedPayRun = (state: RootState): PayRun | undefined => {
  const id = state.payroll.ui.selectedPayRunId;
  return id ? state.payroll.payRuns[id] : undefined;
};

export const selectPayRunsByStatus = (state: RootState, status: PayRunStatus): PayRun[] => {
  return selectAllPayRuns(state).filter((pr) => pr.status === status);
};

export const selectDraftPayRuns = (state: RootState): PayRun[] => {
  return selectPayRunsByStatus(state, 'draft');
};

export const selectPendingPayRuns = (state: RootState): PayRun[] => {
  return selectPayRunsByStatus(state, 'pending_approval');
};

export const selectApprovedPayRuns = (state: RootState): PayRun[] => {
  return selectPayRunsByStatus(state, 'approved');
};

export const selectProcessedPayRuns = (state: RootState): PayRun[] => {
  return selectPayRunsByStatus(state, 'processed');
};

// Filtered and sorted pay runs based on UI state
export const selectFilteredPayRuns = (state: RootState): PayRun[] => {
  const { filterStatus, sortBy, sortOrder } = state.payroll.ui;
  let payRuns = selectAllPayRuns(state);

  // Filter by status
  if (filterStatus !== 'all') {
    payRuns = payRuns.filter((pr) => pr.status === filterStatus);
  }

  // Sort
  payRuns.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'periodStart':
        comparison = a.periodStart.localeCompare(b.periodStart);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'grandTotal':
        comparison = a.totals.grandTotal - b.totals.grandTotal;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return payRuns;
};

// Stats selector
export const selectPayrollStats = (state: RootState) => {
  const payRuns = selectAllPayRuns(state);
  return {
    total: payRuns.length,
    draft: payRuns.filter((pr) => pr.status === 'draft').length,
    pendingApproval: payRuns.filter((pr) => pr.status === 'pending_approval').length,
    approved: payRuns.filter((pr) => pr.status === 'approved').length,
    processed: payRuns.filter((pr) => pr.status === 'processed').length,
    voided: payRuns.filter((pr) => pr.status === 'voided').length,
  };
};

export default payrollSlice.reducer;
