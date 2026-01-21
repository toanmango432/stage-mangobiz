/**
 * Permission Guard Hook
 * Provides permission checking functionality based on user role and permissions
 */

import { useAppSelector } from '@/store/hooks';

// Permission keys that can be checked
type PermissionKey =
  | 'canAccessAdminPortal'
  | 'canAccessReports'
  | 'canModifyPrices'
  | 'canProcessRefunds'
  | 'canDeleteRecords'
  | 'canManageTeam'
  | 'canViewOthersCalendar'
  | 'canBookForOthers'
  | 'canEditOthersAppointments';

// Role-based default permissions
const ROLE_DEFAULT_PERMISSIONS: Record<string, Partial<Record<PermissionKey, boolean>>> = {
  owner: {
    canAccessAdminPortal: true,
    canAccessReports: true,
    canModifyPrices: true,
    canProcessRefunds: true,
    canDeleteRecords: true,
    canManageTeam: true,
    canViewOthersCalendar: true,
    canBookForOthers: true,
    canEditOthersAppointments: true,
  },
  admin: {
    canAccessAdminPortal: true,
    canAccessReports: true,
    canModifyPrices: true,
    canProcessRefunds: true,
    canDeleteRecords: true,
    canManageTeam: true,
    canViewOthersCalendar: true,
    canBookForOthers: true,
    canEditOthersAppointments: true,
  },
  manager: {
    canAccessAdminPortal: false,
    canAccessReports: true,
    canModifyPrices: true,
    canProcessRefunds: true,
    canDeleteRecords: false,
    canManageTeam: true,
    canViewOthersCalendar: true,
    canBookForOthers: true,
    canEditOthersAppointments: true,
  },
  receptionist: {
    canAccessAdminPortal: false,
    canAccessReports: false,
    canModifyPrices: false,
    canProcessRefunds: false,
    canDeleteRecords: false,
    canManageTeam: false,
    canViewOthersCalendar: true,
    canBookForOthers: true,
    canEditOthersAppointments: true,
  },
  staff: {
    canAccessAdminPortal: false,
    canAccessReports: false,
    canModifyPrices: false,
    canProcessRefunds: false,
    canDeleteRecords: false,
    canManageTeam: false,
    canViewOthersCalendar: false,
    canBookForOthers: false,
    canEditOthersAppointments: false,
  },
  junior: {
    canAccessAdminPortal: false,
    canAccessReports: false,
    canModifyPrices: false,
    canProcessRefunds: false,
    canDeleteRecords: false,
    canManageTeam: false,
    canViewOthersCalendar: false,
    canBookForOthers: false,
    canEditOthersAppointments: false,
  },
};

/**
 * Hook to check user permissions throughout the app
 */
export function usePermissionGuard() {
  // Get current member from auth state
  const member = useAppSelector((state) => state.auth.member);
  const role = member?.role || 'staff';
  const memberPermissions = member?.permissions || {};

  // Get role defaults
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS.staff;

  /**
   * Check if user has a specific permission
   * Priority: explicit member permissions > role defaults
   */
  function canAccess(permission: PermissionKey): boolean {
    // Check explicit member permissions first
    if (permission in memberPermissions) {
      return memberPermissions[permission] ?? false;
    }
    // Fall back to role defaults
    return roleDefaults[permission] ?? false;
  }

  /**
   * Check if user can access admin portal
   */
  function canAccessAdminPortal(): boolean {
    return canAccess('canAccessAdminPortal');
  }

  /**
   * Check if user can process refunds
   */
  function canProcessRefunds(): boolean {
    return canAccess('canProcessRefunds');
  }

  /**
   * Check if user can delete records
   */
  function canDeleteRecords(): boolean {
    return canAccess('canDeleteRecords');
  }

  /**
   * Check if user can manage team members
   */
  function canManageTeam(): boolean {
    return canAccess('canManageTeam');
  }

  /**
   * Check if user can access reports
   */
  function canAccessReports(): boolean {
    return canAccess('canAccessReports');
  }

  /**
   * Check if user can modify prices
   */
  function canModifyPrices(): boolean {
    return canAccess('canModifyPrices');
  }

  /**
   * Check if user can view others' calendars
   */
  function canViewOthersCalendar(): boolean {
    return canAccess('canViewOthersCalendar');
  }

  /**
   * Check if user can book for others
   */
  function canBookForOthers(): boolean {
    return canAccess('canBookForOthers');
  }

  /**
   * Check if user can edit others' appointments
   */
  function canEditOthersAppointments(): boolean {
    return canAccess('canEditOthersAppointments');
  }

  return {
    role,
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
  };
}
