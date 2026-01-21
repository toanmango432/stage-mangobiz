/**
 * Team Module Selectors
 *
 * Selectors for accessing team member state.
 * Extracted from teamSlice.ts for file size management.
 */

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
// DERIVED SELECTORS
// ============================================

/**
 * Select all team members as an array
 */
export const selectAllTeamMembers = (state: RootState): TeamMemberSettings[] => {
  return state.team.memberIds.map((id) => state.team.members[id]).filter(Boolean);
};

/**
 * Select only active team members
 */
export const selectActiveTeamMembers = (state: RootState): TeamMemberSettings[] => {
  return selectAllTeamMembers(state).filter((member) => member.isActive);
};

/**
 * Select only archived team members
 */
export const selectArchivedTeamMembers = (state: RootState): TeamMemberSettings[] => {
  return selectAllTeamMembers(state).filter((member) => !member.isActive);
};

/**
 * Select a specific team member by ID
 */
export const selectTeamMemberById = (
  state: RootState,
  memberId: string
): TeamMemberSettings | undefined => {
  return state.team.members[memberId];
};

/**
 * Select the currently selected team member
 */
export const selectSelectedTeamMember = (state: RootState): TeamMemberSettings | null => {
  const selectedId = state.team.ui.selectedMemberId;
  return selectedId ? state.team.members[selectedId] || null : null;
};

// ============================================
// FILTERED SELECTORS
// ============================================

/**
 * Select team members filtered by UI state (search, role, status, sort)
 */
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
// DERIVED QUERY SELECTORS
// ============================================

/**
 * Select team members who are bookable online
 */
export const selectBookableTeamMembers = (state: RootState): TeamMemberSettings[] => {
  return selectActiveTeamMembers(state).filter((member) => member.onlineBooking.isBookableOnline);
};

/**
 * Select team statistics
 */
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
