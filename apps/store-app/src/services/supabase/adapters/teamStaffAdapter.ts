/**
 * Team to Staff Adapter
 *
 * Converts TeamMemberSettings (from Team/Admin module) to Staff (for Book module).
 * This enables a single source of truth: all staff data comes from the `members` table
 * via teamSlice, and is transformed for Book module consumption.
 *
 * Data Flow:
 * members (Supabase) → teamDB (IndexedDB) → teamSlice → teamMemberToStaff() → staffSlice/Book
 */

import type { TeamMemberSettings } from '@/components/team-settings/types';
import type { Staff } from '@/types';
import type { StaffSchedule } from '@/types/staff';
import type { StaffStatus, SyncStatus } from '@/types/common';

/**
 * Convert a single TeamMemberSettings to Staff format.
 * Used by Book module components that expect Staff type.
 */
export function teamMemberToStaff(member: TeamMemberSettings): Staff {
  // Build display name with fallback
  const displayName =
    member.profile?.displayName ||
    `${member.profile?.firstName || ''} ${member.profile?.lastName || ''}`.trim() ||
    'Unknown Staff';

  // Convert working hours to staff schedule format
  const schedule: StaffSchedule[] = (member.workingHours?.regularHours || []).map((rh) => ({
    dayOfWeek: rh.dayOfWeek,
    startTime: rh.shifts?.[0]?.startTime || '09:00',
    endTime: rh.shifts?.[0]?.endTime || '17:00',
    isAvailable: rh.isWorking,
  }));

  // Get service IDs that this staff member can perform
  const specialties = (member.services || [])
    .filter((s) => s.canPerform)
    .map((s) => s.serviceId);

  // Map status - team uses isActive boolean, staff uses status string
  const status: StaffStatus = member.isActive ? 'available' : 'unavailable';

  return {
    id: member.id,
    storeId: member.storeId,
    name: displayName,
    email: member.profile?.email || '',
    phone: member.profile?.phone || '',
    avatar: member.profile?.avatar,
    specialties,
    status,
    isActive: member.isActive,
    role: member.profile?.title,
    hireDate: member.profile?.hireDate,
    commissionRate: member.commission?.basePercentage,
    schedule,
    // Runtime metrics - these are not persisted, set to defaults
    servicesCountToday: 0,
    revenueToday: 0,
    tipsToday: 0,
    // Sync metadata
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    syncStatus: (member.syncStatus as SyncStatus) || 'local',
  };
}

/**
 * Convert an array of TeamMemberSettings to Staff array.
 * Filters out deleted members by default.
 */
export function teamMembersToStaff(
  members: TeamMemberSettings[],
  options?: {
    includeInactive?: boolean;
    includeDeleted?: boolean;
  }
): Staff[] {
  const { includeInactive = false, includeDeleted = false } = options || {};

  return members
    .filter((m) => {
      // Always exclude deleted unless explicitly included
      if (!includeDeleted && m.isDeleted) return false;
      // Exclude inactive unless explicitly included
      if (!includeInactive && !m.isActive) return false;
      return true;
    })
    .map(teamMemberToStaff);
}

/**
 * Get active staff from team members.
 * This is the most common use case for Book module.
 */
export function getActiveStaffFromTeam(members: TeamMemberSettings[]): Staff[] {
  return teamMembersToStaff(members, { includeInactive: false, includeDeleted: false });
}

/**
 * Find a specific staff member by ID from team data.
 */
export function findStaffInTeam(
  members: TeamMemberSettings[],
  staffId: string
): Staff | undefined {
  const member = members.find((m) => m.id === staffId);
  return member ? teamMemberToStaff(member) : undefined;
}

/**
 * Filter team members by service capability.
 * Returns Staff[] that can perform a specific service.
 */
export function getStaffForService(
  members: TeamMemberSettings[],
  serviceId: string
): Staff[] {
  return members
    .filter((m) => {
      if (m.isDeleted || !m.isActive) return false;
      return m.services?.some((s) => s.serviceId === serviceId && s.canPerform);
    })
    .map(teamMemberToStaff);
}
