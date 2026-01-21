/**
 * Team Slice Module Exports
 *
 * Re-exports all team-related Redux functionality from the module structure.
 */

// Thunks
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
  optimisticActions,
} from './teamThunks';

// Selectors (memoized with createSelector)
export {
  // Base selectors
  selectTeamState,
  selectTeamMembers,
  selectTeamMemberIds,
  selectTeamLoading,
  selectTeamError,
  selectTeamUI,
  selectTeamSync,
  selectPendingOperations,
  // Pending operation selectors
  selectIsMemberPending,
  selectMemberPendingOperation,
  // Derived selectors (memoized)
  selectAllTeamMembers,
  selectActiveTeamMembers,
  selectArchivedTeamMembers,
  selectTeamMemberById,
  selectSelectedTeamMember,
  // Filter UI state selectors
  selectTeamSearchQuery,
  selectTeamFilterRole,
  selectTeamFilterStatus,
  selectTeamSortBy,
  selectTeamSortOrder,
  // Filtered selectors (memoized)
  selectFilteredTeamMembers,
  // Field selectors
  selectMemberPermissions,
  selectMemberServices,
  selectMemberSchedule,
  selectMemberTimeOffRequests,
  selectMemberScheduleOverrides,
  selectMemberCommission,
  selectMemberOnlineBooking,
  selectMemberNotifications,
  // Derived query selectors (memoized)
  selectBookableTeamMembers,
  selectTeamStats,
} from './teamSelectors';

// Types
export type { TeamStats } from './teamSelectors';
