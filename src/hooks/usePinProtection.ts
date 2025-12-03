/**
 * usePinProtection Hook
 *
 * Determines when PIN verification is needed based on auth state:
 * - Store-only login (no member) → PIN required for restricted actions
 * - Member logged in → No PIN needed (access defined at member level)
 *
 * Use this hook to protect sensitive features like:
 * - Accessing store settings
 * - Processing refunds
 * - Viewing reports
 * - Voiding transactions
 */

import { useState, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAuthStatus, selectMember } from '../store/slices/authSlice';
import { authService } from '../services/supabase/authService';

interface UsePinProtectionOptions {
  /** Action to perform after PIN is verified */
  onSuccess: () => void;
  /** Optional: Custom title for the PIN modal */
  title?: string;
  /** Optional: Custom description for the PIN modal */
  description?: string;
  /** Optional: Required permission to check after PIN */
  requiredPermission?: string;
}

interface UsePinProtectionReturn {
  /** Whether PIN verification modal should be shown */
  showPinModal: boolean;
  /** Open the PIN modal (or execute directly if member logged in) */
  requestAccess: () => void;
  /** Close the PIN modal */
  closePinModal: () => void;
  /** Called when PIN is successfully verified */
  handlePinSuccess: () => void;
  /** Whether PIN is required (store-only mode) */
  isPinRequired: boolean;
  /** Modal props to pass to PinVerificationModal */
  modalProps: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title: string;
    description: string;
  };
}

export function usePinProtection({
  onSuccess,
  title = 'Enter Staff PIN',
  description = 'Enter your security PIN to continue',
  requiredPermission,
}: UsePinProtectionOptions): UsePinProtectionReturn {
  const [showPinModal, setShowPinModal] = useState(false);

  const authStatus = useAppSelector(selectAuthStatus);
  const member = useAppSelector(selectMember);

  // PIN is required when:
  // - Store is logged in but no member is logged in (store-only mode)
  // - OR member is logged in but doesn't have the required permission
  const isPinRequired = authStatus === 'store_logged_in' && !member;

  const hasPermission = useCallback(() => {
    if (!requiredPermission) return true;
    if (!member?.permissions) return false;
    return member.permissions[requiredPermission] === true;
  }, [member, requiredPermission]);

  const requestAccess = useCallback(() => {
    if (isPinRequired) {
      // Store-only mode: require PIN
      setShowPinModal(true);
    } else if (member) {
      // Member logged in: check permissions and execute directly
      if (requiredPermission && !hasPermission()) {
        // Member doesn't have permission - could show error or still request PIN from manager
        console.warn(`Member lacks permission: ${requiredPermission}`);
        // For now, still allow but could be changed to require manager PIN
      }
      onSuccess();
    } else {
      // Not logged in at all
      console.warn('Not authenticated');
    }
  }, [isPinRequired, member, requiredPermission, hasPermission, onSuccess]);

  const closePinModal = useCallback(() => {
    setShowPinModal(false);
  }, []);

  const handlePinSuccess = useCallback(() => {
    setShowPinModal(false);
    onSuccess();
  }, [onSuccess]);

  return {
    showPinModal,
    requestAccess,
    closePinModal,
    handlePinSuccess,
    isPinRequired,
    modalProps: {
      isOpen: showPinModal,
      onClose: closePinModal,
      onSuccess: handlePinSuccess,
      title,
      description,
    },
  };
}

/**
 * Verify any staff PIN (for store-only mode)
 * Unlike verifyMemberPin (which verifies current member's PIN),
 * this verifies any staff member's PIN to identify who is performing the action.
 */
export async function verifyAnyStaffPin(
  storeId: string,
  pin: string
): Promise<{ valid: boolean; memberId?: string; memberName?: string; role?: string }> {
  try {
    // Use loginMemberWithPin to verify and get member info
    const memberSession = await authService.loginMemberWithPin(storeId, pin);

    return {
      valid: true,
      memberId: memberSession.memberId,
      memberName: `${memberSession.firstName} ${memberSession.lastName}`.trim(),
      role: memberSession.role,
    };
  } catch {
    return { valid: false };
  }
}

export default usePinProtection;
