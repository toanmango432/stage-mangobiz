/**
 * Permission Guarded Button Component
 * Wraps buttons that require specific permissions, showing disabled state with tooltip
 * when user lacks the required permission.
 */

import React from 'react';
import Tippy from '@tippyjs/react';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

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

interface PermissionGuardedButtonProps {
  /** The permission required to enable this button */
  permission: PermissionKey;
  /** Message to show when permission is denied */
  deniedMessage?: string;
  /** The button element to wrap */
  children: React.ReactElement<{ disabled?: boolean; className?: string; onClick?: () => void }>;
  /** Override the permission check (for testing) */
  forceEnabled?: boolean;
}

/**
 * Wraps a button to add permission checking.
 * When the user lacks the required permission, the button is disabled
 * and a tooltip shows the denied message.
 *
 * @example
 * <PermissionGuardedButton permission="canDeleteRecords">
 *   <button onClick={handleDelete}>Delete</button>
 * </PermissionGuardedButton>
 */
export function PermissionGuardedButton({
  permission,
  deniedMessage = "You don't have permission to perform this action",
  children,
  forceEnabled = false,
}: PermissionGuardedButtonProps) {
  const { canAccess } = usePermissionGuard();
  const hasPermission = forceEnabled || canAccess(permission);

  if (hasPermission) {
    // User has permission - render the button as-is
    return children;
  }

  // User lacks permission - clone the button with disabled state
  const disabledButton = React.cloneElement(children, {
    disabled: true,
    className: `${children.props.className || ''} opacity-50 cursor-not-allowed`,
    onClick: undefined, // Remove click handler
  });

  return (
    <Tippy content={deniedMessage} placement="top">
      <span className="inline-block">{disabledButton}</span>
    </Tippy>
  );
}

/**
 * Hook to check if a delete operation should be allowed.
 * Returns the permission status and a message to show if denied.
 */
export function useDeletePermission() {
  const { canDeleteRecords } = usePermissionGuard();
  const allowed = canDeleteRecords();

  return {
    allowed,
    message: allowed ? null : "You don't have permission to delete records",
  };
}

/**
 * Hook to check if a refund operation should be allowed.
 */
export function useRefundPermission() {
  const { canProcessRefunds } = usePermissionGuard();
  const allowed = canProcessRefunds();

  return {
    allowed,
    message: allowed ? null : "You don't have permission to process refunds",
  };
}

export default PermissionGuardedButton;
