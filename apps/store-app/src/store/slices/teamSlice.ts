import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type {
  TeamMemberSettings,
  TeamMemberProfile,
  ServicePricing,
  WorkingHoursSettings,
  RolePermissions,
  CommissionSettings,
  PayrollSettings,
  OnlineBookingSettings,
  NotificationPreferences,
  PerformanceGoals,
  TimeOffRequest,
  ScheduleOverride,
  TeamSettingsSection,
  StaffRole,
} from '../../components/team-settings/types';
import { SyncContext, getDefaultSyncContext } from '../utils/syncContext';

// ============================================
// STATE TYPES
// ============================================

export interface TeamUIState {
  selectedMemberId: string | null;
  activeSection: TeamSettingsSection;
  searchQuery: string;
  filterRole: StaffRole | 'all';
  filterStatus: 'all' | 'active' | 'inactive' | 'archived';
  sortBy: 'name' | 'role' | 'hireDate' | 'performance';
  sortOrder: 'asc' | 'desc';
  isAddingNew: boolean;
  hasUnsavedChanges: boolean;
  isMobileListVisible: boolean;
}

export interface TeamSyncState {
  lastSyncAt: string | null;
  pendingChanges: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  syncError: string | null;
}

/**
 * Tracks a pending optimistic operation for rollback capability.
 */
export interface PendingOperation {
  type: 'create' | 'update' | 'delete' | 'archive' | 'restore';
  entityId: string;
  previousState?: TeamMemberSettings;
  timestamp: number;
}

export interface TeamState {
  // Data (normalized by member ID)
  members: Record<string, TeamMemberSettings>;
  memberIds: string[]; // For ordering

  // Loading states
  loading: boolean;
  loadingMemberId: string | null;
  error: string | null;

  // Pending operations for optimistic updates
  pendingOperations: Record<string, PendingOperation>;

  // UI State
  ui: TeamUIState;

  // Sync State
  sync: TeamSyncState;
}

// ============================================
// INITIAL STATE
// ============================================

const initialUIState: TeamUIState = {
  selectedMemberId: null,
  activeSection: 'profile',
  searchQuery: '',
  filterRole: 'all',
  filterStatus: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
  isAddingNew: false,
  hasUnsavedChanges: false,
  isMobileListVisible: true,
};

const initialSyncState: TeamSyncState = {
  lastSyncAt: null,
  pendingChanges: 0,
  syncStatus: 'idle',
  syncError: null,
};

const initialState: TeamState = {
  members: {},
  memberIds: [],
  loading: false,
  loadingMemberId: null,
  error: null,
  pendingOperations: {},
  ui: initialUIState,
  sync: initialSyncState,
};

// ============================================
// ASYNC THUNKS
// All mutation thunks now require SyncContext
// ============================================

// Fetch all team members
// Priority: Supabase (source of truth) -> IndexedDB (offline fallback)
export const fetchTeamMembers = createAsyncThunk(
  'team/fetchAll',
  async (storeId: string | undefined, { rejectWithValue }) => {
    const effectiveStoreId = storeId || 'default-store';

    try {
      // Try Supabase first (source of truth for online operations)
      const { fetchSupabaseMembers } = await import('../../services/supabase/memberService');
      const supabaseMembers = await fetchSupabaseMembers(effectiveStoreId);

      if (supabaseMembers && supabaseMembers.length > 0) {
        console.log('[teamSlice] Fetched', supabaseMembers.length, 'members from Supabase');

        // Sync to IndexedDB for offline access
        try {
          const { teamDB } = await import('../../db/teamOperations');
          for (const member of supabaseMembers) {
            await teamDB.upsertMember(member, 'system', 'system');
          }
          console.log('[teamSlice] Synced members to IndexedDB');
        } catch (syncError) {
          console.warn('[teamSlice] Failed to sync to IndexedDB:', syncError);
          // Continue - Supabase data is still valid
        }

        return supabaseMembers;
      }

      // Fallback to IndexedDB if Supabase returns empty (might be offline)
      console.log('[teamSlice] No Supabase data, falling back to IndexedDB');
      const { teamDB } = await import('../../db/teamOperations');
      const members = await teamDB.getAllMembers(effectiveStoreId);
      return members;
    } catch (error) {
      // If Supabase fails, try IndexedDB as offline fallback
      console.warn('[teamSlice] Supabase failed, trying IndexedDB:', error);
      try {
        const { teamDB } = await import('../../db/teamOperations');
        const members = await teamDB.getAllMembers(effectiveStoreId);
        if (members && members.length > 0) {
          console.log('[teamSlice] Using IndexedDB fallback:', members.length, 'members');
          return members;
        }
      } catch (indexedDBError) {
        console.error('[teamSlice] IndexedDB also failed:', indexedDBError);
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch team members');
    }
  }
);

// Fetch single team member with all related data
export const fetchTeamMember = createAsyncThunk(
  'team/fetchOne',
  async (memberId: string, { rejectWithValue }) => {
    try {
      const { teamDB } = await import('../../db/teamOperations');
      const member = await teamDB.getActiveMemberById(memberId);
      if (!member) {
        return rejectWithValue('Team member not found');
      }
      return member;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch team member');
    }
  }
);

// Optimistic update action creators (defined before thunk to avoid circular reference)
// These are dispatched within the thunk for optimistic updates
const optimisticActions = {
  updateMemberOptimistic: (member: TeamMemberSettings) => ({
    type: 'team/updateMemberOptimistic' as const,
    payload: member,
  }),
  setPendingOperation: (data: { entityId: string; operation: PendingOperation }) => ({
    type: 'team/setPendingOperation' as const,
    payload: data,
  }),
  clearPendingOperation: (entityId: string) => ({
    type: 'team/clearPendingOperation' as const,
    payload: entityId,
  }),
  removeMemberOptimistic: (id: string) => ({
    type: 'team/removeMember' as const,
    payload: id,
  }),
};

// Save team member (create or update) with optimistic updates
export const saveTeamMember = createAsyncThunk(
  'team/save',
  async (
    { member, context }: { member: TeamMemberSettings; context?: SyncContext },
    { dispatch, getState, rejectWithValue }
  ) => {
    const state = getState() as RootState;
    const existingMember = state.team.members[member.id];
    const isUpdate = !!existingMember;

    // 1. Store previous state for potential rollback
    if (isUpdate) {
      dispatch(optimisticActions.setPendingOperation({
        entityId: member.id,
        operation: {
          type: 'update',
          entityId: member.id,
          previousState: existingMember,
          timestamp: Date.now(),
        },
      }));
    } else {
      dispatch(optimisticActions.setPendingOperation({
        entityId: member.id,
        operation: {
          type: 'create',
          entityId: member.id,
          timestamp: Date.now(),
        },
      }));
    }

    // 2. Optimistically update the UI immediately
    dispatch(optimisticActions.updateMemberOptimistic(member));

    try {
      const { teamDB } = await import('../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      const existing = await teamDB.getMemberById(member.id);

      let savedMember: TeamMemberSettings;

      if (existing) {
        savedMember = await teamDB.updateMember(member.id, member, ctx.userId, ctx.deviceId);
      } else {
        // Ensure required sync fields are set for new members
        const newMember: TeamMemberSettings = {
          ...member,
          tenantId: member.tenantId || ctx.tenantId || 'default-tenant',
          storeId: member.storeId || ctx.storeId || 'default-store',
        };
        await teamDB.createMember(newMember, ctx.userId, ctx.deviceId);
        savedMember = (await teamDB.getMemberById(member.id))!;
      }

      // 3. Clear pending operation on success
      dispatch(optimisticActions.clearPendingOperation(member.id));

      return savedMember;
    } catch (error) {
      // 4. Rollback on failure
      if (existingMember) {
        dispatch(optimisticActions.updateMemberOptimistic(existingMember));
      } else {
        dispatch(optimisticActions.removeMemberOptimistic(member.id));
      }
      dispatch(optimisticActions.clearPendingOperation(member.id));

      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save team member');
    }
  }
);

// Archive team member (sets isActive = false)
export const archiveTeamMember = createAsyncThunk(
  'team/archive',
  async (
    { memberId, context }: { memberId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      const updated = await teamDB.archiveMember(memberId, ctx.userId, ctx.deviceId);
      return updated;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to archive team member');
    }
  }
);

// Restore archived team member
export const restoreTeamMember = createAsyncThunk(
  'team/restore',
  async (
    { memberId, context }: { memberId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      const updated = await teamDB.restoreMember(memberId, ctx.userId, ctx.deviceId);
      return updated;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to restore team member');
    }
  }
);

// Soft delete team member (tombstone pattern)
export const deleteTeamMember = createAsyncThunk(
  'team/delete',
  async (
    { memberId, context }: { memberId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      await teamDB.softDeleteMember(memberId, ctx.userId, ctx.deviceId);
      return memberId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete team member');
    }
  }
);

// Save time off request
export const saveTimeOffRequest = createAsyncThunk(
  'team/saveTimeOff',
  async (
    { memberId, request, context }: { memberId: string; request: TimeOffRequest; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      await teamDB.saveTimeOffRequest(memberId, request, ctx.userId, ctx.deviceId);
      return { memberId, request };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save time off request');
    }
  }
);

// Delete time off request
export const deleteTimeOffRequest = createAsyncThunk(
  'team/deleteTimeOff',
  async (
    { memberId, requestId, context }: { memberId: string; requestId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      await teamDB.deleteTimeOffRequest(memberId, requestId, ctx.userId, ctx.deviceId);
      return { memberId, requestId };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete time off request');
    }
  }
);

// Save schedule override
export const saveScheduleOverride = createAsyncThunk(
  'team/saveOverride',
  async (
    { memberId, override, context }: { memberId: string; override: ScheduleOverride; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      await teamDB.saveScheduleOverride(memberId, override, ctx.userId, ctx.deviceId);
      return { memberId, override };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save schedule override');
    }
  }
);

// Delete schedule override
export const deleteScheduleOverride = createAsyncThunk(
  'team/deleteOverride',
  async (
    { memberId, overrideId, context }: { memberId: string; overrideId: string; context?: SyncContext },
    { rejectWithValue }
  ) => {
    try {
      const { teamDB } = await import('../../db/teamOperations');
      const ctx = context || getDefaultSyncContext();
      await teamDB.deleteScheduleOverride(memberId, overrideId, ctx.userId, ctx.deviceId);
      return { memberId, overrideId };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete schedule override');
    }
  }
);

// ============================================
// SLICE
// ============================================

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    // ---- Member CRUD (local state updates) ----
    setMembers: (state, action: PayloadAction<TeamMemberSettings[]>) => {
      state.members = {};
      state.memberIds = [];
      action.payload.forEach((member) => {
        state.members[member.id] = member;
        state.memberIds.push(member.id);
      });
    },

    addMember: (state, action: PayloadAction<TeamMemberSettings>) => {
      const member = action.payload;
      state.members[member.id] = member;
      if (!state.memberIds.includes(member.id)) {
        state.memberIds.push(member.id);
      }
    },

    updateMember: (state, action: PayloadAction<{ id: string; updates: Partial<TeamMemberSettings> }>) => {
      const { id, updates } = action.payload;
      if (state.members[id]) {
        state.members[id] = {
          ...state.members[id],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    removeMember: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.members[id];
      state.memberIds = state.memberIds.filter((memberId) => memberId !== id);
      if (state.ui.selectedMemberId === id) {
        state.ui.selectedMemberId = null;
      }
    },

    // ---- Profile updates ----
    updateMemberProfile: (state, action: PayloadAction<{ id: string; profile: Partial<TeamMemberProfile> }>) => {
      const { id, profile } = action.payload;
      if (state.members[id]) {
        state.members[id].profile = {
          ...state.members[id].profile,
          ...profile,
        };
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Services updates ----
    updateMemberServices: (state, action: PayloadAction<{ id: string; services: ServicePricing[] }>) => {
      const { id, services } = action.payload;
      if (state.members[id]) {
        state.members[id].services = services;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Schedule updates ----
    updateMemberSchedule: (state, action: PayloadAction<{ id: string; workingHours: WorkingHoursSettings }>) => {
      const { id, workingHours } = action.payload;
      if (state.members[id]) {
        state.members[id].workingHours = workingHours;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Permissions updates ----
    updateMemberPermissions: (state, action: PayloadAction<{ id: string; permissions: RolePermissions }>) => {
      const { id, permissions } = action.payload;
      if (state.members[id]) {
        state.members[id].permissions = permissions;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Commission updates ----
    updateMemberCommission: (state, action: PayloadAction<{ id: string; commission: CommissionSettings }>) => {
      const { id, commission } = action.payload;
      if (state.members[id]) {
        state.members[id].commission = commission;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Payroll updates ----
    updateMemberPayroll: (state, action: PayloadAction<{ id: string; payroll: PayrollSettings }>) => {
      const { id, payroll } = action.payload;
      if (state.members[id]) {
        state.members[id].payroll = payroll;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Online booking updates ----
    updateMemberOnlineBooking: (state, action: PayloadAction<{ id: string; onlineBooking: OnlineBookingSettings }>) => {
      const { id, onlineBooking } = action.payload;
      if (state.members[id]) {
        state.members[id].onlineBooking = onlineBooking;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Notifications updates ----
    updateMemberNotifications: (state, action: PayloadAction<{ id: string; notifications: NotificationPreferences }>) => {
      const { id, notifications } = action.payload;
      if (state.members[id]) {
        state.members[id].notifications = notifications;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Performance goals updates ----
    updateMemberPerformanceGoals: (state, action: PayloadAction<{ id: string; goals: PerformanceGoals }>) => {
      const { id, goals } = action.payload;
      if (state.members[id]) {
        state.members[id].performanceGoals = goals;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Time off request updates (local) ----
    addTimeOffRequest: (state, action: PayloadAction<{ memberId: string; request: TimeOffRequest }>) => {
      const { memberId, request } = action.payload;
      if (state.members[memberId]) {
        state.members[memberId].workingHours.timeOffRequests.push(request);
        state.members[memberId].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    updateTimeOffRequest: (state, action: PayloadAction<{ memberId: string; request: TimeOffRequest }>) => {
      const { memberId, request } = action.payload;
      if (state.members[memberId]) {
        const requests = state.members[memberId].workingHours.timeOffRequests;
        const index = requests.findIndex((r) => r.id === request.id);
        if (index !== -1) {
          requests[index] = request;
          state.members[memberId].updatedAt = new Date().toISOString();
          state.ui.hasUnsavedChanges = true;
        }
      }
    },

    removeTimeOffRequest: (state, action: PayloadAction<{ memberId: string; requestId: string }>) => {
      const { memberId, requestId } = action.payload;
      if (state.members[memberId]) {
        state.members[memberId].workingHours.timeOffRequests =
          state.members[memberId].workingHours.timeOffRequests.filter((r) => r.id !== requestId);
        state.members[memberId].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Schedule override updates (local) ----
    addScheduleOverride: (state, action: PayloadAction<{ memberId: string; override: ScheduleOverride }>) => {
      const { memberId, override } = action.payload;
      if (state.members[memberId]) {
        state.members[memberId].workingHours.scheduleOverrides.push(override);
        state.members[memberId].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    updateScheduleOverride: (state, action: PayloadAction<{ memberId: string; override: ScheduleOverride }>) => {
      const { memberId, override } = action.payload;
      if (state.members[memberId]) {
        const overrides = state.members[memberId].workingHours.scheduleOverrides;
        const index = overrides.findIndex((o) => o.id === override.id);
        if (index !== -1) {
          overrides[index] = override;
          state.members[memberId].updatedAt = new Date().toISOString();
          state.ui.hasUnsavedChanges = true;
        }
      }
    },

    removeScheduleOverride: (state, action: PayloadAction<{ memberId: string; overrideId: string }>) => {
      const { memberId, overrideId } = action.payload;
      if (state.members[memberId]) {
        state.members[memberId].workingHours.scheduleOverrides =
          state.members[memberId].workingHours.scheduleOverrides.filter((o) => o.id !== overrideId);
        state.members[memberId].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- UI State ----
    setSelectedMember: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedMemberId = action.payload;
      state.ui.hasUnsavedChanges = false;
    },

    setActiveSection: (state, action: PayloadAction<TeamSettingsSection>) => {
      state.ui.activeSection = action.payload;
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.ui.searchQuery = action.payload;
    },

    setFilterRole: (state, action: PayloadAction<StaffRole | 'all'>) => {
      state.ui.filterRole = action.payload;
    },

    setFilterStatus: (state, action: PayloadAction<'all' | 'active' | 'inactive' | 'archived'>) => {
      state.ui.filterStatus = action.payload;
    },

    setSortBy: (state, action: PayloadAction<'name' | 'role' | 'hireDate' | 'performance'>) => {
      state.ui.sortBy = action.payload;
    },

    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.ui.sortOrder = action.payload;
    },

    setIsAddingNew: (state, action: PayloadAction<boolean>) => {
      state.ui.isAddingNew = action.payload;
    },

    setHasUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.ui.hasUnsavedChanges = action.payload;
    },

    setMobileListVisible: (state, action: PayloadAction<boolean>) => {
      state.ui.isMobileListVisible = action.payload;
    },

    // ---- Error handling ----
    clearError: (state) => {
      state.error = null;
    },

    // ---- Optimistic update support ----
    updateMemberOptimistic: (state, action: PayloadAction<TeamMemberSettings>) => {
      const member = action.payload;
      state.members[member.id] = member;
      if (!state.memberIds.includes(member.id)) {
        state.memberIds.push(member.id);
      }
    },

    setPendingOperation: (state, action: PayloadAction<{ entityId: string; operation: PendingOperation }>) => {
      const { entityId, operation } = action.payload;
      state.pendingOperations[entityId] = operation;
    },

    clearPendingOperation: (state, action: PayloadAction<string>) => {
      delete state.pendingOperations[action.payload];
    },

    clearAllPendingOperations: (state) => {
      state.pendingOperations = {};
    },

    // ---- Sync state ----
    setSyncStatus: (state, action: PayloadAction<'idle' | 'syncing' | 'error'>) => {
      state.sync.syncStatus = action.payload;
    },

    incrementPendingChanges: (state) => {
      state.sync.pendingChanges += 1;
    },

    decrementPendingChanges: (state) => {
      state.sync.pendingChanges = Math.max(0, state.sync.pendingChanges - 1);
    },

    setLastSyncAt: (state, action: PayloadAction<string>) => {
      state.sync.lastSyncAt = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch all team members
    builder
      .addCase(fetchTeamMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = {};
        state.memberIds = [];
        action.payload.forEach((member) => {
          state.members[member.id] = member;
          state.memberIds.push(member.id);
        });
      })
      .addCase(fetchTeamMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch single team member
    builder
      .addCase(fetchTeamMember.pending, (state, action) => {
        state.loadingMemberId = action.meta.arg;
      })
      .addCase(fetchTeamMember.fulfilled, (state, action) => {
        state.loadingMemberId = null;
        const member = action.payload;
        state.members[member.id] = member;
        if (!state.memberIds.includes(member.id)) {
          state.memberIds.push(member.id);
        }
      })
      .addCase(fetchTeamMember.rejected, (state, action) => {
        state.loadingMemberId = null;
        state.error = action.payload as string;
      });

    // Save team member
    builder
      .addCase(saveTeamMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveTeamMember.fulfilled, (state, action) => {
        state.loading = false;
        const member = action.payload;
        // Use the full returned member which includes all sync fields
        state.members[member.id] = member;
        if (!state.memberIds.includes(member.id)) {
          state.memberIds.push(member.id);
        }
        state.ui.hasUnsavedChanges = false;
        // Track pending sync
        if (member.syncStatus === 'pending' || member.syncStatus === 'local') {
          state.sync.pendingChanges = Object.values(state.members).filter(
            (m) => m.syncStatus === 'pending' || m.syncStatus === 'local'
          ).length;
        }
      })
      .addCase(saveTeamMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Archive team member
    builder
      .addCase(archiveTeamMember.fulfilled, (state, action) => {
        const member = action.payload;
        // Update with the full returned member (includes updated sync fields)
        state.members[member.id] = member;
      })
      .addCase(archiveTeamMember.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Restore team member
    builder
      .addCase(restoreTeamMember.fulfilled, (state, action) => {
        const member = action.payload;
        // Update with the full returned member (includes updated sync fields)
        state.members[member.id] = member;
      })
      .addCase(restoreTeamMember.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Delete team member
    builder
      .addCase(deleteTeamMember.fulfilled, (state, action) => {
        const id = action.payload;
        delete state.members[id];
        state.memberIds = state.memberIds.filter((memberId) => memberId !== id);
        if (state.ui.selectedMemberId === id) {
          state.ui.selectedMemberId = null;
        }
      })
      .addCase(deleteTeamMember.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Time off request
    builder
      .addCase(saveTimeOffRequest.fulfilled, (state, action) => {
        const { memberId, request } = action.payload;
        if (state.members[memberId]) {
          const requests = state.members[memberId].workingHours.timeOffRequests;
          const existingIndex = requests.findIndex((r) => r.id === request.id);
          if (existingIndex !== -1) {
            requests[existingIndex] = request;
          } else {
            requests.push(request);
          }
        }
      })
      .addCase(deleteTimeOffRequest.fulfilled, (state, action) => {
        const { memberId, requestId } = action.payload;
        if (state.members[memberId]) {
          state.members[memberId].workingHours.timeOffRequests =
            state.members[memberId].workingHours.timeOffRequests.filter((r) => r.id !== requestId);
        }
      });

    // Schedule override
    builder
      .addCase(saveScheduleOverride.fulfilled, (state, action) => {
        const { memberId, override } = action.payload;
        if (state.members[memberId]) {
          const overrides = state.members[memberId].workingHours.scheduleOverrides;
          const existingIndex = overrides.findIndex((o) => o.id === override.id);
          if (existingIndex !== -1) {
            overrides[existingIndex] = override;
          } else {
            overrides.push(override);
          }
        }
      })
      .addCase(deleteScheduleOverride.fulfilled, (state, action) => {
        const { memberId, overrideId } = action.payload;
        if (state.members[memberId]) {
          state.members[memberId].workingHours.scheduleOverrides =
            state.members[memberId].workingHours.scheduleOverrides.filter((o) => o.id !== overrideId);
        }
      });
  },
});

// ============================================
// ACTIONS EXPORT
// ============================================

export const {
  setMembers,
  addMember,
  updateMember,
  removeMember,
  updateMemberProfile,
  updateMemberServices,
  updateMemberSchedule,
  updateMemberPermissions,
  updateMemberCommission,
  updateMemberPayroll,
  updateMemberOnlineBooking,
  updateMemberNotifications,
  updateMemberPerformanceGoals,
  addTimeOffRequest,
  updateTimeOffRequest,
  removeTimeOffRequest,
  addScheduleOverride,
  updateScheduleOverride,
  removeScheduleOverride,
  setSelectedMember,
  setActiveSection,
  setSearchQuery,
  setFilterRole,
  setFilterStatus,
  setSortBy,
  setSortOrder,
  setIsAddingNew,
  setHasUnsavedChanges,
  setMobileListVisible,
  clearError,
  // Optimistic updates
  updateMemberOptimistic,
  setPendingOperation,
  clearPendingOperation,
  clearAllPendingOperations,
  // Sync state
  setSyncStatus,
  incrementPendingChanges,
  decrementPendingChanges,
  setLastSyncAt,
} = teamSlice.actions;

// ============================================
// SELECTORS
// ============================================

// Basic selectors
export const selectTeamState = (state: RootState) => state.team;
export const selectTeamMembers = (state: RootState) => state.team.members;
export const selectTeamMemberIds = (state: RootState) => state.team.memberIds;
export const selectTeamLoading = (state: RootState) => state.team.loading;
export const selectTeamError = (state: RootState) => state.team.error;
export const selectTeamUI = (state: RootState) => state.team.ui;
export const selectTeamSync = (state: RootState) => state.team.sync;
export const selectPendingOperations = (state: RootState) => state.team.pendingOperations;

// Check if a specific member has a pending operation
export const selectIsMemberPending = (state: RootState, memberId: string): boolean => {
  return !!state.team.pendingOperations[memberId];
};

// Get pending operation for a specific member
export const selectMemberPendingOperation = (state: RootState, memberId: string): PendingOperation | undefined => {
  return state.team.pendingOperations[memberId];
};

// Derived selectors
export const selectAllTeamMembers = (state: RootState): TeamMemberSettings[] => {
  return state.team.memberIds.map((id) => state.team.members[id]).filter(Boolean);
};

export const selectActiveTeamMembers = (state: RootState): TeamMemberSettings[] => {
  return selectAllTeamMembers(state).filter((member) => member.isActive);
};

export const selectArchivedTeamMembers = (state: RootState): TeamMemberSettings[] => {
  return selectAllTeamMembers(state).filter((member) => !member.isActive);
};

export const selectTeamMemberById = (state: RootState, memberId: string): TeamMemberSettings | undefined => {
  return state.team.members[memberId];
};

export const selectSelectedTeamMember = (state: RootState): TeamMemberSettings | null => {
  const selectedId = state.team.ui.selectedMemberId;
  return selectedId ? state.team.members[selectedId] || null : null;
};

// Filtered selectors based on UI state
export const selectFilteredTeamMembers = (state: RootState): TeamMemberSettings[] => {
  const { searchQuery, filterRole, filterStatus, sortBy, sortOrder } = state.team.ui;
  let members = selectAllTeamMembers(state);

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    members = members.filter((member) =>
      member.profile.firstName.toLowerCase().includes(query) ||
      member.profile.lastName.toLowerCase().includes(query) ||
      member.profile.displayName.toLowerCase().includes(query) ||
      member.profile.email.toLowerCase().includes(query)
    );
  }

  // Filter by role
  if (filterRole !== 'all') {
    members = members.filter((member) => member.permissions.role === filterRole);
  }

  // Filter by status
  if (filterStatus === 'active') {
    members = members.filter((member) => member.isActive);
  } else if (filterStatus === 'inactive' || filterStatus === 'archived') {
    members = members.filter((member) => !member.isActive);
  }

  // Sort
  members.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.profile.firstName.localeCompare(b.profile.firstName);
        break;
      case 'role':
        comparison = a.permissions.role.localeCompare(b.permissions.role);
        break;
      case 'hireDate':
        comparison = (a.profile.hireDate || '').localeCompare(b.profile.hireDate || '');
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return members;
};

// Permission-related selectors
export const selectMemberPermissions = (state: RootState, memberId: string): RolePermissions | undefined => {
  return state.team.members[memberId]?.permissions;
};

export const selectMemberServices = (state: RootState, memberId: string): ServicePricing[] => {
  return state.team.members[memberId]?.services || [];
};

export const selectMemberSchedule = (state: RootState, memberId: string): WorkingHoursSettings | undefined => {
  return state.team.members[memberId]?.workingHours;
};

export const selectMemberTimeOffRequests = (state: RootState, memberId: string): TimeOffRequest[] => {
  return state.team.members[memberId]?.workingHours.timeOffRequests || [];
};

export const selectMemberScheduleOverrides = (state: RootState, memberId: string): ScheduleOverride[] => {
  return state.team.members[memberId]?.workingHours.scheduleOverrides || [];
};

export const selectMemberCommission = (state: RootState, memberId: string): CommissionSettings | undefined => {
  return state.team.members[memberId]?.commission;
};

export const selectMemberOnlineBooking = (state: RootState, memberId: string): OnlineBookingSettings | undefined => {
  return state.team.members[memberId]?.onlineBooking;
};

export const selectMemberNotifications = (state: RootState, memberId: string): NotificationPreferences | undefined => {
  return state.team.members[memberId]?.notifications;
};

// Bookable members (for online booking)
export const selectBookableTeamMembers = (state: RootState): TeamMemberSettings[] => {
  return selectActiveTeamMembers(state).filter((member) => member.onlineBooking.isBookableOnline);
};

// Team stats
export const selectTeamStats = (state: RootState) => {
  const members = selectAllTeamMembers(state);
  const active = members.filter((m) => m.isActive);
  const bookable = members.filter((m) => m.onlineBooking.isBookableOnline);

  // Count by role
  const roleCount: Record<string, number> = {};
  active.forEach((member) => {
    const role = member.permissions.role;
    roleCount[role] = (roleCount[role] || 0) + 1;
  });

  return {
    total: members.length,
    active: active.length,
    archived: members.length - active.length,
    bookable: bookable.length,
    byRole: roleCount,
  };
};

export default teamSlice.reducer;
