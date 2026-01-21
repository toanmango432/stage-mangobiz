/**
 * Team Module Selectors
 *
 * Memoized selectors for efficient team member state access.
 * Uses createSelector for derived data to prevent unnecessary recalculations.
 *
 * @see scheduleSelectors.ts for the reference pattern
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../index';
import type {
  TeamMemberSettings,
  ServicePricing,
  WorkingHoursSettings,
  TimeOffRequest,
  ScheduleOverride,
  RolePermissions,
  CommissionSettings,
  OnlineBookingSettings,
  NotificationPreferences,
} from '../../../components/team-settings/types';
import type { TeamState, TeamUIState, TeamSyncState, PendingOperation } from '../teamSlice';

// ============================================
// BASE SELECTORS
// ============================================

/**
 * Select the entire team state slice
 */
export const selectTeamState = (state: RootState): TeamState => state.team;

/**
 * Select the team members record (by ID)
 */
export const selectTeamMembers = (state: RootState): Record<string, TeamMemberSettings> =>
  state.team.members;

/**
 * Select the list of team member IDs
 */
export const selectTeamMemberIds = (state: RootState): string[] => state.team.memberIds;

/**
 * Select the loading state
 */
export const selectTeamLoading = (state: RootState): boolean => state.team.loading;

/**
 * Select any error message
 */
export const selectTeamError = (state: RootState): string | null => state.team.error;

/**
 * Select the UI state
 */
export const selectTeamUI = (state: RootState): TeamUIState => state.team.ui;

/**
 * Select the sync state
 */
export const selectTeamSync = (state: RootState): TeamSyncState => state.team.sync;

/**
 * Select all pending operations
 */
export const selectPendingOperations = (state: RootState): Record<string, PendingOperation> =>
  state.team.pendingOperations;

// ============================================
// PENDING OPERATION SELECTORS
// ============================================

/**
 * Check if a specific member has a pending operation
 */
export const selectIsMemberPending = (state: RootState, memberId: string): boolean => {
  return !!state.team.pendingOperations[memberId];
};

/**
 * Get pending operation for a specific member
 */
export const selectMemberPendingOperation = (
  state: RootState,
  memberId: string
): PendingOperation | undefined => {
  return state.team.pendingOperations[memberId];
};

// ============================================
// DERIVED SELECTORS (MEMOIZED)
// ============================================

/**
 * Select all team members as an array.
 * Memoized to prevent unnecessary re-renders.
 */
export const selectAllTeamMembers = createSelector(
  [selectTeamMemberIds, selectTeamMembers],
  (memberIds, members): TeamMemberSettings[] =>
    memberIds.map((id) => members[id]).filter(Boolean)
);

/**
 * Select only active team members.
 * Memoized - only recalculates when members change.
 */
export const selectActiveTeamMembers = createSelector(
  [selectAllTeamMembers],
  (members): TeamMemberSettings[] => members.filter((member) => member.isActive)
);

/**
 * Select only archived team members.
 * Memoized - only recalculates when members change.
 */
export const selectArchivedTeamMembers = createSelector(
  [selectAllTeamMembers],
  (members): TeamMemberSettings[] => members.filter((member) => !member.isActive)
);

/**
 * Select a specific team member by ID (non-memoized for parameterized lookup).
 */
export const selectTeamMemberById = (
  state: RootState,
  memberId: string
): TeamMemberSettings | undefined => {
  return state.team.members[memberId];
};

/**
 * Select the currently selected team member.
 * Memoized based on selected ID and members state.
 */
export const selectSelectedTeamMember = createSelector(
  [selectTeamUI, selectTeamMembers],
  (ui, members): TeamMemberSettings | null => {
    const selectedId = ui.selectedMemberId;
    return selectedId ? members[selectedId] || null : null;
  }
);

// ============================================
// FILTER UI STATE SELECTORS
// ============================================

/** Select search query from UI state */
export const selectTeamSearchQuery = (state: RootState): string => state.team.ui.searchQuery;

/** Select filter role from UI state */
export const selectTeamFilterRole = (state: RootState): string => state.team.ui.filterRole;

/** Select filter status from UI state */
export const selectTeamFilterStatus = (state: RootState): string => state.team.ui.filterStatus;

/** Select sort field from UI state */
export const selectTeamSortBy = (state: RootState): string => state.team.ui.sortBy;

/** Select sort order from UI state */
export const selectTeamSortOrder = (state: RootState): 'asc' | 'desc' => state.team.ui.sortOrder;

// ============================================
// FILTERED SELECTORS (MEMOIZED)
// ============================================

/**
 * Helper to compare members for sorting.
 */
const compareMembers = (
  a: TeamMemberSettings,
  b: TeamMemberSettings,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): number => {
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
};

/**
 * Select team members filtered by UI state (search, role, status, sort).
 * Memoized with granular input selectors for optimal performance.
 */
export const selectFilteredTeamMembers = createSelector(
  [
    selectAllTeamMembers,
    selectTeamSearchQuery,
    selectTeamFilterRole,
    selectTeamFilterStatus,
    selectTeamSortBy,
    selectTeamSortOrder,
  ],
  (members, searchQuery, filterRole, filterStatus, sortBy, sortOrder): TeamMemberSettings[] => {
    let result = [...members];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (member) =>
          member.profile.firstName.toLowerCase().includes(query) ||
          member.profile.lastName.toLowerCase().includes(query) ||
          member.profile.displayName.toLowerCase().includes(query) ||
          member.profile.email.toLowerCase().includes(query)
      );
    }

    // Filter by role
    if (filterRole !== 'all') {
      result = result.filter((member) => member.permissions.role === filterRole);
    }

    // Filter by status
    if (filterStatus === 'active') {
      result = result.filter((member) => member.isActive);
    } else if (filterStatus === 'inactive' || filterStatus === 'archived') {
      result = result.filter((member) => !member.isActive);
    }

    // Sort
    result.sort((a, b) => compareMembers(a, b, sortBy, sortOrder));

    return result;
  }
);

// ============================================
// FIELD SELECTORS
// ============================================

/**
 * Select permissions for a specific member
 */
export const selectMemberPermissions = (
  state: RootState,
  memberId: string
): RolePermissions | undefined => {
  return state.team.members[memberId]?.permissions;
};

/**
 * Select services for a specific member
 */
export const selectMemberServices = (state: RootState, memberId: string): ServicePricing[] => {
  return state.team.members[memberId]?.services || [];
};

/**
 * Select schedule/working hours for a specific member
 */
export const selectMemberSchedule = (
  state: RootState,
  memberId: string
): WorkingHoursSettings | undefined => {
  return state.team.members[memberId]?.workingHours;
};

/**
 * Select time-off requests for a specific member
 */
export const selectMemberTimeOffRequests = (
  state: RootState,
  memberId: string
): TimeOffRequest[] => {
  return state.team.members[memberId]?.workingHours.timeOffRequests || [];
};

/**
 * Select schedule overrides for a specific member
 */
export const selectMemberScheduleOverrides = (
  state: RootState,
  memberId: string
): ScheduleOverride[] => {
  return state.team.members[memberId]?.workingHours.scheduleOverrides || [];
};

/**
 * Select commission settings for a specific member
 */
export const selectMemberCommission = (
  state: RootState,
  memberId: string
): CommissionSettings | undefined => {
  return state.team.members[memberId]?.commission;
};

/**
 * Select online booking settings for a specific member
 */
export const selectMemberOnlineBooking = (
  state: RootState,
  memberId: string
): OnlineBookingSettings | undefined => {
  return state.team.members[memberId]?.onlineBooking;
};

/**
 * Select notification preferences for a specific member
 */
export const selectMemberNotifications = (
  state: RootState,
  memberId: string
): NotificationPreferences | undefined => {
  return state.team.members[memberId]?.notifications;
};

// ============================================
// DERIVED QUERY SELECTORS (MEMOIZED)
// ============================================

/**
 * Select team members who are bookable online.
 * Memoized - only recalculates when active members change.
 */
export const selectBookableTeamMembers = createSelector(
  [selectActiveTeamMembers],
  (members): TeamMemberSettings[] =>
    members.filter((member) => member.onlineBooking.isBookableOnline)
);

/**
 * Team statistics result type
 */
export interface TeamStats {
  total: number;
  active: number;
  archived: number;
  bookable: number;
  byRole: Record<string, number>;
}

/**
 * Select team statistics.
 * Memoized - computes stats only when members change.
 */
export const selectTeamStats = createSelector(
  [selectAllTeamMembers, selectActiveTeamMembers, selectBookableTeamMembers],
  (allMembers, activeMembers, bookableMembers): TeamStats => {
    // Count by role
    const roleCount: Record<string, number> = {};
    activeMembers.forEach((member) => {
      const role = member.permissions.role;
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    return {
      total: allMembers.length,
      active: activeMembers.length,
      archived: allMembers.length - activeMembers.length,
      bookable: bookableMembers.length,
      byRole: roleCount,
    };
  }
);
