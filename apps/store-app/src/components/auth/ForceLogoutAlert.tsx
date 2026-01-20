/**
 * Force Logout Alert
 *
 * Displays a modal alert when the user has been forcibly logged out
 * due to session expiration, account deactivation, password change,
 * or session revocation.
 *
 * This component listens to Redux auth state and shows the appropriate
 * message when forceLogoutReason is set.
 */

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectForceLogoutReason,
  selectForceLogoutMessage,
  clearForceLogoutReason,
} from '@/store/slices/authSlice';
import { AlertTriangle, LogIn, X } from 'lucide-react';
import type { ForceLogoutReason } from '@/types/memberAuth';

/**
 * Get icon and title based on logout reason
 */
function getAlertDetails(reason: ForceLogoutReason): {
  title: string;
  iconColor: string;
} {
  switch (reason) {
    case 'offline_grace_expired':
      return {
        title: 'Offline Access Expired',
        iconColor: 'text-amber-500',
      };
    case 'account_deactivated':
      return {
        title: 'Account Deactivated',
        iconColor: 'text-red-500',
      };
    case 'password_changed':
      return {
        title: 'Password Changed',
        iconColor: 'text-blue-500',
      };
    case 'session_revoked':
      return {
        title: 'Session Revoked',
        iconColor: 'text-red-500',
      };
    default:
      return {
        title: 'Session Ended',
        iconColor: 'text-gray-500',
      };
  }
}

/**
 * Force Logout Alert Component
 *
 * Shows a modal overlay when the user has been force logged out.
 * The user must acknowledge the message before proceeding.
 */
export function ForceLogoutAlert() {
  const dispatch = useAppDispatch();
  const reason = useAppSelector(selectForceLogoutReason);
  const message = useAppSelector(selectForceLogoutMessage);

  // Don't render if no force logout reason
  if (!reason) {
    return null;
  }

  const { title, iconColor } = getAlertDetails(reason);

  const handleAcknowledge = () => {
    dispatch(clearForceLogoutReason());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="alertdialog"
      aria-labelledby="force-logout-title"
      aria-describedby="force-logout-message"
    >
      <div className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleAcknowledge}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className={`rounded-full bg-gray-100 p-4 ${iconColor}`}>
            <AlertTriangle className="h-8 w-8" />
          </div>
        </div>

        {/* Title */}
        <h2
          id="force-logout-title"
          className="mb-2 text-center text-xl font-semibold text-gray-900"
        >
          {title}
        </h2>

        {/* Message */}
        <p
          id="force-logout-message"
          className="mb-6 text-center text-gray-600"
        >
          {message || 'Your session has ended. Please log in again to continue.'}
        </p>

        {/* Action button */}
        <button
          onClick={handleAcknowledge}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 font-medium text-white hover:bg-orange-600 transition-colors"
        >
          <LogIn className="h-5 w-5" />
          Continue to Login
        </button>
      </div>
    </div>
  );
}

export default ForceLogoutAlert;
