/**
 * Team Redux Slice
 *
 * Manages team member state with optimistic updates, offline support,
 * and sync tracking for the Team Settings module.
 *
 * Thunks are extracted to team/teamThunks.ts for file size management.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type {
  TeamMemberSettings,
  TeamMemberProfile,
  ServicePricing,
  WorkingHoursSettings,
  TimeOffRequest,
  ScheduleOverride,
  RolePermissions,
  CommissionSettings,
  PayrollSettings,
  OnlineBookingSettings,
  NotificationPreferences,
  PerformanceGoals,
  TeamSettingsSection,
  StaffRole,
} from '../../components/team-settings/types';

// Import thunks from extracted file
import {
  fetchTeamMembers,
  fetchTeamMember,
  saveTeamMember,
  archiveTeamMember,
  restoreTeamMember,
  deleteTeamMember,
  saveTimeOffRequest,
  deleteTimeOffRequest,
  saveScheduleOverride,
  deleteScheduleOverride,
} from './team/teamThunks';

// Re-export thunks for consumers
export {
  fetchTeamMembers,
  fetchTeamMember,
  saveTeamMember,
  archiveTeamMember,
  restoreTeamMember,
  deleteTeamMember,
  saveTimeOffRequest,
  deleteTimeOffRequest,
  saveScheduleOverride,
  deleteScheduleOverride,
};

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
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncAt: string | null;
  pendingChanges: number;
}

export interface PendingOperation {
  type: 'create' | 'update' | 'delete';
  entityId: string;
  previousState?: TeamMemberSettings;
  timestamp: number;
}

export interface TeamState {
  members: Record<string, TeamMemberSettings>;
  memberIds: string[];
  loading: boolean;
  loadingMemberId: string | null;
  error: string | null;
  pendingOperations: Record<string, PendingOperation>;
  ui: TeamUIState;
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
  syncStatus: 'idle',
  lastSyncAt: null,
  pendingChanges: 0,
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

    updateMember: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<TeamMemberSettings> }>
    ) => {
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
    updateMemberProfile: (
      state,
      action: PayloadAction<{ id: string; profile: Partial<TeamMemberProfile> }>
    ) => {
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
    updateMemberServices: (
      state,
      action: PayloadAction<{ id: string; services: ServicePricing[] }>
    ) => {
      const { id, services } = action.payload;
      if (state.members[id]) {
        state.members[id].services = services;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Schedule updates ----
    updateMemberSchedule: (
      state,
      action: PayloadAction<{ id: string; workingHours: WorkingHoursSettings }>
    ) => {
      const { id, workingHours } = action.payload;
      if (state.members[id]) {
        state.members[id].workingHours = workingHours;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Permissions updates ----
    updateMemberPermissions: (
      state,
      action: PayloadAction<{ id: string; permissions: RolePermissions }>
    ) => {
      const { id, permissions } = action.payload;
      if (state.members[id]) {
        state.members[id].permissions = permissions;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Commission updates ----
    updateMemberCommission: (
      state,
      action: PayloadAction<{ id: string; commission: CommissionSettings }>
    ) => {
      const { id, commission } = action.payload;
      if (state.members[id]) {
        state.members[id].commission = commission;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Payroll updates ----
    updateMemberPayroll: (
      state,
      action: PayloadAction<{ id: string; payroll: PayrollSettings }>
    ) => {
      const { id, payroll } = action.payload;
      if (state.members[id]) {
        state.members[id].payroll = payroll;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Online booking updates ----
    updateMemberOnlineBooking: (
      state,
      action: PayloadAction<{ id: string; onlineBooking: OnlineBookingSettings }>
    ) => {
      const { id, onlineBooking } = action.payload;
      if (state.members[id]) {
        state.members[id].onlineBooking = onlineBooking;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Notifications updates ----
    updateMemberNotifications: (
      state,
      action: PayloadAction<{ id: string; notifications: NotificationPreferences }>
    ) => {
      const { id, notifications } = action.payload;
      if (state.members[id]) {
        state.members[id].notifications = notifications;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Performance goals updates ----
    updateMemberPerformanceGoals: (
      state,
      action: PayloadAction<{ id: string; goals: PerformanceGoals }>
    ) => {
      const { id, goals } = action.payload;
      if (state.members[id]) {
        state.members[id].performanceGoals = goals;
        state.members[id].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Time off request updates (local) ----
    addTimeOffRequest: (
      state,
      action: PayloadAction<{ memberId: string; request: TimeOffRequest }>
    ) => {
      const { memberId, request } = action.payload;
      if (state.members[memberId]) {
        state.members[memberId].workingHours.timeOffRequests.push(request);
        state.members[memberId].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    updateTimeOffRequest: (
      state,
      action: PayloadAction<{ memberId: string; request: TimeOffRequest }>
    ) => {
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

    removeTimeOffRequest: (
      state,
      action: PayloadAction<{ memberId: string; requestId: string }>
    ) => {
      const { memberId, requestId } = action.payload;
      if (state.members[memberId]) {
        state.members[memberId].workingHours.timeOffRequests =
          state.members[memberId].workingHours.timeOffRequests.filter((r) => r.id !== requestId);
        state.members[memberId].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    // ---- Schedule override updates (local) ----
    addScheduleOverride: (
      state,
      action: PayloadAction<{ memberId: string; override: ScheduleOverride }>
    ) => {
      const { memberId, override } = action.payload;
      if (state.members[memberId]) {
        state.members[memberId].workingHours.scheduleOverrides.push(override);
        state.members[memberId].updatedAt = new Date().toISOString();
        state.ui.hasUnsavedChanges = true;
      }
    },

    updateScheduleOverride: (
      state,
      action: PayloadAction<{ memberId: string; override: ScheduleOverride }>
    ) => {
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

    removeScheduleOverride: (
      state,
      action: PayloadAction<{ memberId: string; overrideId: string }>
    ) => {
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

    setFilterStatus: (
      state,
      action: PayloadAction<'all' | 'active' | 'inactive' | 'archived'>
    ) => {
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

    setPendingOperation: (
      state,
      action: PayloadAction<{ entityId: string; operation: PendingOperation }>
    ) => {
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
            state.members[memberId].workingHours.scheduleOverrides.filter(
              (o) => o.id !== overrideId
            );
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
export const selectMemberPendingOperation = (
  state: RootState,
  memberId: string
): PendingOperation | undefined => {
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

export const selectTeamMemberById = (
  state: RootState,
  memberId: string
): TeamMemberSettings | undefined => {
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
    members = members.filter(
      (member) =>
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
export const selectMemberPermissions = (
  state: RootState,
  memberId: string
): RolePermissions | undefined => {
  return state.team.members[memberId]?.permissions;
};

export const selectMemberServices = (state: RootState, memberId: string): ServicePricing[] => {
  return state.team.members[memberId]?.services || [];
};

export const selectMemberSchedule = (
  state: RootState,
  memberId: string
): WorkingHoursSettings | undefined => {
  return state.team.members[memberId]?.workingHours;
};

export const selectMemberTimeOffRequests = (
  state: RootState,
  memberId: string
): TimeOffRequest[] => {
  return state.team.members[memberId]?.workingHours.timeOffRequests || [];
};

export const selectMemberScheduleOverrides = (
  state: RootState,
  memberId: string
): ScheduleOverride[] => {
  return state.team.members[memberId]?.workingHours.scheduleOverrides || [];
};

export const selectMemberCommission = (
  state: RootState,
  memberId: string
): CommissionSettings | undefined => {
  return state.team.members[memberId]?.commission;
};

export const selectMemberOnlineBooking = (
  state: RootState,
  memberId: string
): OnlineBookingSettings | undefined => {
  return state.team.members[memberId]?.onlineBooking;
};

export const selectMemberNotifications = (
  state: RootState,
  memberId: string
): NotificationPreferences | undefined => {
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
