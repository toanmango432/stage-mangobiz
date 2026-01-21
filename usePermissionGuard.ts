/**
 * usePermissionGuard Hook
 *
 * Provides permission checking for the current authenticated user.
 * Uses the member's permissions from teamSlice combined with auth state.
 */

import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectMember } from '@/store/slices/authSlice';
import { selectTeamMemberById } from '@/store/slices/teamSlice';
import type { RolePermissions } from '@/components/team-settings/types';

/**
 * Default permissions for when no user is logged in or permissions not found
 */
const DEFAULT_PERMISSIONS: RolePermissions = {
  role: 'stylist',
  permissions: [],
  canAccessAdminPortal: false,
  canAccessReports: false,
  canModifyPrices: false,
  canProcessRefunds: false,
  canDeleteRecords: false,
  canManageTeam: false,
  canViewOthersCalendar: false,
  canBookForOthers: false,
  canEditOthersAppointments: false,
  pinRequired: false,
};

/**
 * Hook for checking user permissions throughout the app.
 *
 * @returns Object with permission checking methods and the full permissions object
 */
export function usePermissionGuard() {
  const member = useAppSelector(selectMember);
  const teamMember = useAppSelector((state) =>
    member?.memberId ? selectTeamMemberById(state, member.memberId) : undefined
  );

  // Get permissions from team member settings, falling back to defaults
  const permissions: RolePermissions = useMemo(() => {
    if (teamMember?.permissions) {
      return teamMember.permissions;
    }

    // Fallback: check if member has inline permissions from auth
    if (member?.permissions) {
      // Convert Record<string, boolean> to RolePermissions
      // Map auth roles to StaffRoles (auth uses different role set)
      const roleMap: Record<string, RolePermissions['role']> = {
        owner: 'owner',
        manager: 'manager',
        staff: 'stylist',
        receptionist: 'receptionist',
        junior: 'junior_stylist',
        admin: 'owner',
      };
      return {
        ...DEFAULT_PERMISSIONS,
        role: roleMap[member.role] || 'stylist',
        canAccessAdminPortal: member.permissions.canAccessAdminPortal ?? false,
        canAccessReports: member.permissions.canAccessReports ?? false,
        canModifyPrices: member.permissions.canModifyPrices ?? false,
        canProcessRefunds: member.permissions.canProcessRefunds ?? false,
        canDeleteRecords: member.permissions.canDeleteRecords ?? false,
        canManageTeam: member.permissions.canManageTeam ?? false,
        canViewOthersCalendar: member.permissions.canViewOthersCalendar ?? false,
        canBookForOthers: member.permissions.canBookForOthers ?? false,
        canEditOthersAppointments: member.permissions.canEditOthersAppointments ?? false,
      };
    }

    return DEFAULT_PERMISSIONS;
  }, [teamMember?.permissions, member?.permissions, member?.role]);

  /**
   * Check if user can access a specific permission
   */
  const canAccess = (permission: keyof Omit<RolePermissions, 'role' | 'permissions' | 'pin' | 'pinRequired'>): boolean => {
    return permissions[permission] ?? false;
  };

  /**
   * Check if user can access the Admin Portal
   */
  const canAccessAdminPortal = (): boolean => {
    return permissions.canAccessAdminPortal;
  };

  /**
   * Check if user can process refunds
   */
  const canProcessRefunds = (): boolean => {
    return permissions.canProcessRefunds;
  };

  /**
   * Check if user can delete records
   */
  const canDeleteRecords = (): boolean => {
    return permissions.canDeleteRecords;
  };

  /**
   * Check if user can manage team members
   */
  const canManageTeam = (): boolean => {
    return permissions.canManageTeam;
  };

  /**
   * Check if user can access reports
   */
  const canAccessReports = (): boolean => {
    return permissions.canAccessReports;
  };

  /**
   * Check if user can modify prices
   */
  const canModifyPrices = (): boolean => {
    return permissions.canModifyPrices;
  };

  /**
   * Check if user can view others' calendars
   */
  const canViewOthersCalendar = (): boolean => {
    return permissions.canViewOthersCalendar;
  };

  /**
   * Check if user can book appointments for others
   */
  const canBookForOthers = (): boolean => {
    return permissions.canBookForOthers;
  };

  /**
   * Check if user can edit others' appointments
   */
  const canEditOthersAppointments = (): boolean => {
    return permissions.canEditOthersAppointments;
  };

  /**
   * Check if PIN is required for sensitive operations
   */
  const isPinRequired = (): boolean => {
    return permissions.pinRequired;
  };

  /**
   * Get the user's role
   */
  const getRole = () => permissions.role;

  return {
    // Permission checking methods
    canAccess,
    canAccessAdminPortal,
    canProcessRefunds,
    canDeleteRecords,
    canManageTeam,
    canAccessReports,
    canModifyPrices,
    canViewOthersCalendar,
    canBookForOthers,
    canEditOthersAppointments,
    isPinRequired,
    getRole,
    // Full permissions object for direct access
    permissions,
    // Whether user is authenticated
    isAuthenticated: !!member,
  };
}
