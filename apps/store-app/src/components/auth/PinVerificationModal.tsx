/**
 * PIN Verification Modal for Store-Login Mode Sensitive Actions
 *
 * This modal is used in STORE-LOGIN context when staff need to verify their
 * identity before accessing sensitive features (checkout, settings, reports).
 *
 * Authentication Flow:
 * 1. Staff enters their PIN (4-6 digits)
 * 2. PIN is validated using bcrypt via memberAuthService.loginWithPin()
 * 3. On success, returns verified member session
 * 4. On failure, tracks attempts (5 max, 15-min lockout)
 *
 * Features:
 * - Uses PinInput component for PIN entry
 * - Shows lockout status if PIN is locked
 * - Shows "Forgot PIN?" link for admin reset flow
 * - Auto-focuses PIN input when modal opens
 * - Supports card scan detection (legacy, disabled by default)
 *
 * @see docs/AUTH_MIGRATION_PLAN.md
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle, CheckCircle, ShieldCheck, User, CreditCard, Lock, HelpCircle } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { selectMember, selectStoreId } from '../../store/slices/authSlice';
import { authService } from '../../services/supabase/authService';
import { memberAuthService } from '../../services/memberAuthService';
import { PinInput } from './PinInput';
import type { MemberAuthSession } from '../../types/memberAuth';
import { AUTH_MESSAGES, AUTH_TIMEOUTS } from './constants';

export interface VerifiedMember {
  memberId: string;
  memberName: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface PinVerificationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Called with member session on successful verification */
  onSuccess: (memberSession: MemberAuthSession) => void;
  /** Member ID to verify. If provided, validates specific member's PIN. If omitted, allows any staff PIN (legacy store-only mode). */
  memberId?: string;
  /** Description of the action being verified (e.g., 'Verify to access Checkout') */
  actionDescription?: string;
  /**
   * @deprecated Use actionDescription instead
   */
  description?: string;
  /** Modal title override */
  title?: string;
  /** Enable card scan detection (default: false for new implementation) */
  enableCardScan?: boolean;
}

type Step = 'auth' | 'success';

export function PinVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  memberId,
  actionDescription,
  description, // deprecated, use actionDescription
  title = 'Verify Identity',
  enableCardScan = false, // Disabled by default for new implementation
}: PinVerificationModalProps) {
  // Support deprecated description prop
  const displayActionDescription = actionDescription || description;
  const currentMember = useAppSelector(selectMember);
  const storeId = useAppSelector(selectStoreId);

  const [step, setStep] = useState<Step>('auth');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedMember, setVerifiedMember] = useState<VerifiedMember | null>(null);
  const [cardScanActive, setCardScanActive] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{ isLocked: boolean; remainingMinutes: number }>({ isLocked: false, remainingMinutes: 0 });
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [memberName, setMemberName] = useState<string>('');

  // Card reader detection (legacy feature)
  const cardBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const cardTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lockout countdown timer ref
  const lockoutIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check lockout status and get member name when modal opens
  useEffect(() => {
    if (isOpen) {
      if (memberId) {
        // Specific member mode: Check lockout status
        const lockout = memberAuthService.checkPinLockout(memberId);
        setLockoutInfo(lockout);

        // Initialize countdown seconds from remaining minutes
        if (lockout.isLocked) {
          setLockoutSeconds(lockout.remainingMinutes * 60);
        }

        // Get cached member info for display
        const cachedMembers = memberAuthService.getCachedMembers();
        const cachedMember = cachedMembers.find(m => m.memberId === memberId);
        if (cachedMember) {
          setMemberName(cachedMember.name);
        } else if (currentMember && currentMember.memberId === memberId) {
          setMemberName(`${currentMember.firstName} ${currentMember.lastName}`.trim());
        }
      } else {
        // Legacy store-only mode: No lockout check, no specific member
        setLockoutInfo({ isLocked: false, remainingMinutes: 0 });
        setLockoutSeconds(0);
        setMemberName('');
      }
    }
  }, [isOpen, memberId, currentMember]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('auth');
      setPin('');
      setError(null);
      setVerifiedMember(null);
      setCardScanActive(false);
      setLockoutInfo({ isLocked: false, remainingMinutes: 0 });
      setLockoutSeconds(0);
      setMemberName('');
      cardBufferRef.current = '';
      if (cardTimeoutRef.current) {
        clearTimeout(cardTimeoutRef.current);
      }
      // Clear lockout countdown interval on close
      if (lockoutIntervalRef.current) {
        clearInterval(lockoutIntervalRef.current);
        lockoutIntervalRef.current = null;
      }
    }
  }, [isOpen]);

  // Real-time countdown timer for lockout
  useEffect(() => {
    // Start interval when locked
    if (lockoutInfo.isLocked && lockoutSeconds > 0) {
      // Clear any existing interval first
      if (lockoutIntervalRef.current) {
        clearInterval(lockoutIntervalRef.current);
      }

      lockoutIntervalRef.current = setInterval(() => {
        setLockoutSeconds(prev => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            // Lockout expired - clear interval and reset lockout state
            if (lockoutIntervalRef.current) {
              clearInterval(lockoutIntervalRef.current);
              lockoutIntervalRef.current = null;
            }
            setLockoutInfo({ isLocked: false, remainingMinutes: 0 });
            return 0;
          }
          return newValue;
        });
      }, 1000);
    }

    // Cleanup on unmount or when lockout state changes
    return () => {
      if (lockoutIntervalRef.current) {
        clearInterval(lockoutIntervalRef.current);
        lockoutIntervalRef.current = null;
      }
    };
  }, [lockoutInfo.isLocked, lockoutSeconds > 0]); // Note: Only start interval based on isLocked state and whether lockoutSeconds is positive

  // Global keyboard listener for card reader detection
  useEffect(() => {
    if (!isOpen || !enableCardScan || step !== 'auth' || loading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If Enter key and we have buffered card data
      if (e.key === 'Enter' && cardBufferRef.current.length >= AUTH_TIMEOUTS.CARD_MIN_LENGTH) {
        e.preventDefault();
        const cardData = cardBufferRef.current;
        cardBufferRef.current = '';
        setCardScanActive(false);
        handleCardSubmit(cardData);
        return;
      }

      // Detect rapid input (card reader behavior)
      if (timeSinceLastKey < AUTH_TIMEOUTS.CARD_INPUT_TIMEOUT_MS && e.key.length === 1) {
        // This looks like card reader input
        cardBufferRef.current += e.key;
        setCardScanActive(true);

        // Clear any existing timeout
        if (cardTimeoutRef.current) {
          clearTimeout(cardTimeoutRef.current);
        }

        // Set timeout to clear buffer if no more rapid input
        cardTimeoutRef.current = setTimeout(() => {
          if (cardBufferRef.current.length >= AUTH_TIMEOUTS.CARD_MIN_LENGTH) {
            // Auto-submit if we have enough data
            const cardData = cardBufferRef.current;
            cardBufferRef.current = '';
            setCardScanActive(false);
            handleCardSubmit(cardData);
          } else {
            // Not enough data, clear buffer
            cardBufferRef.current = '';
            setCardScanActive(false);
          }
        }, AUTH_TIMEOUTS.CARD_BUFFER_TIMEOUT_MS);

        // Prevent the character from being typed in PIN input
        // But only if we're definitely in card mode (buffer has data)
        if (cardBufferRef.current.length > 1) {
          e.preventDefault();
        }
      } else if (e.key.length === 1 && /\d/.test(e.key)) {
        // Single digit typed slowly - this is manual PIN entry
        // Let it go through to the PIN input normally
        cardBufferRef.current = '';
      } else if (e.key.length === 1) {
        // Non-digit typed slowly - might be start of card swipe
        cardBufferRef.current = e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (cardTimeoutRef.current) {
        clearTimeout(cardTimeoutRef.current);
      }
    };
  }, [isOpen, enableCardScan, step, loading]);

  // Handle success with member session
  const handleAuthSuccess = useCallback((memberSession: MemberAuthSession) => {
    // Extract name parts from session name
    const nameParts = memberSession.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const verified: VerifiedMember = {
      memberId: memberSession.memberId,
      memberName: memberSession.name,
      firstName,
      lastName,
      role: memberSession.role,
    };

    setVerifiedMember(verified);
    setStep('success');

    setTimeout(() => {
      onSuccess(memberSession);
      onClose();
    }, AUTH_TIMEOUTS.VERIFICATION_SUCCESS_MS);
  }, [onSuccess, onClose]);

  // Handle PIN submission using memberAuthService.loginWithPin() with bcrypt
  const handlePinSubmit = useCallback(async (enteredPin?: string) => {
    const pinToVerify = enteredPin || pin;
    if (pinToVerify.length < 4) return;

    setLoading(true);
    setError(null);

    try {
      if (memberId) {
        // New flow: Specific member verification using bcrypt
        // Check lockout first
        const lockout = memberAuthService.checkPinLockout(memberId);
        if (lockout.isLocked) {
          setLockoutInfo(lockout);
          setError(AUTH_MESSAGES.PIN_LOCKED_TRY_AGAIN(lockout.remainingMinutes));
          setPin('');
          setLoading(false);
          return;
        }

        // Use memberAuthService.loginWithPin() for bcrypt validation
        const memberSession = await memberAuthService.loginWithPin(memberId, pinToVerify);
        handleAuthSuccess(memberSession);
      } else {
        // Legacy flow: Any staff PIN in store-only mode
        // Uses old authService.loginMemberWithPin()
        if (!storeId) {
          setError(AUTH_MESSAGES.STORE_NOT_CONNECTED);
          setLoading(false);
          return;
        }

        const legacySession = await authService.loginMemberWithPin(storeId, pinToVerify);

        // Convert legacy session to MemberAuthSession format
        const memberSession: MemberAuthSession = {
          memberId: legacySession.memberId,
          authUserId: '', // Not available from legacy service
          email: '', // Not available from legacy service
          name: `${legacySession.firstName} ${legacySession.lastName}`.trim(),
          role: legacySession.role,
          storeIds: storeId ? [storeId] : [],
          permissions: {},
          lastOnlineAuth: new Date(),
          sessionCreatedAt: new Date(),
          defaultStoreId: null,
        };
        handleAuthSuccess(memberSession);
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : AUTH_MESSAGES.VERIFICATION_FAILED;
      setError(errorMessage);
      setPin('');

      // Re-check lockout status after failed attempt (if memberId provided)
      if (memberId) {
        const lockout = memberAuthService.checkPinLockout(memberId);
        setLockoutInfo(lockout);
        // Initialize countdown if newly locked
        if (lockout.isLocked) {
          setLockoutSeconds(lockout.remainingMinutes * 60);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [pin, memberId, storeId, handleAuthSuccess]);

  // Handle Card submission (legacy feature - kept for backwards compatibility)
  const handleCardSubmit = useCallback(async (cardId: string) => {
    if (!cardId.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (!storeId) {
        setError(AUTH_MESSAGES.STORE_NOT_CONNECTED);
        setLoading(false);
        return;
      }

      // Legacy card verification - uses old authService
      const memberSession = await authService.verifyMemberCard(storeId, cardId.trim());

      if (memberSession) {
        // Convert legacy session to MemberAuthSession format
        const session: MemberAuthSession = {
          memberId: memberSession.memberId,
          authUserId: '', // Not available from legacy service
          email: '', // Not available from legacy service
          name: `${memberSession.firstName} ${memberSession.lastName}`.trim(),
          role: memberSession.role,
          storeIds: storeId ? [storeId] : [],
          permissions: {},
          lastOnlineAuth: new Date(),
          sessionCreatedAt: new Date(),
          defaultStoreId: null,
        };
        handleAuthSuccess(session);
      } else {
        setError(AUTH_MESSAGES.CARD_NOT_RECOGNIZED);
      }
    } catch (err: unknown) {
      setError(AUTH_MESSAGES.CARD_NOT_RECOGNIZED);
    } finally {
      setLoading(false);
    }
  }, [storeId, handleAuthSuccess]);

  // Handle PIN change from PinInput component
  const handlePinChange = useCallback((value: string) => {
    setPin(value);
    setError(null);
  }, []);

  // Handle PIN completion - auto-submit when PIN length is reached
  const handlePinComplete = useCallback((value: string) => {
    if (value.length >= 4 && !loading && !lockoutInfo.isLocked) {
      handlePinSubmit(value);
    }
  }, [handlePinSubmit, loading, lockoutInfo.isLocked]);

  if (!isOpen) return null;

  const modalRoot = document.getElementById('pin-modal-root');
  if (!modalRoot) return null;

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Auth Step */}
          {step === 'auth' && (
            <div className="space-y-6">
              {/* Member Name Display */}
              <div className="text-center">
                {/* Show initials avatar */}
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                  {memberName ? memberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : <User className="w-8 h-8" />}
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {memberName || AUTH_MESSAGES.STAFF_MEMBER}
                </p>
                {displayActionDescription && (
                  <p className="text-sm text-gray-500 mt-1">
                    {displayActionDescription}
                  </p>
                )}
              </div>

              {/* Lockout Warning */}
              {lockoutInfo.isLocked && (
                <div className="flex items-center justify-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <Lock className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-red-700">{AUTH_MESSAGES.PIN_LOCKED}</p>
                    <p className="text-xs text-red-600">
                      {AUTH_MESSAGES.PIN_LOCKED_DETAIL} Try again in{' '}
                      <span className="font-mono font-semibold">
                        {Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* PIN Input using PinInput component */}
              {!lockoutInfo.isLocked && (
                <>
                  <PinInput
                    value={pin}
                    onChange={handlePinChange}
                    onComplete={handlePinComplete}
                    length={4}
                    disabled={loading || cardScanActive}
                    error={!!error}
                    autoFocus
                  />

                  {/* Card Scan Indicator (legacy feature) */}
                  {enableCardScan && (
                    <div className={`flex items-center justify-center gap-2 transition-all ${cardScanActive ? 'text-purple-600' : 'text-gray-400'}`}>
                      <CreditCard className={`w-4 h-4 ${cardScanActive ? 'animate-pulse' : ''}`} />
                      <span className="text-xs">
                        {cardScanActive ? AUTH_MESSAGES.CARD_READING : AUTH_MESSAGES.CARD_SCAN_PROMPT}
                      </span>
                      {!cardScanActive && (
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Error Message */}
              {error && !lockoutInfo.isLocked && (
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-center justify-center gap-2 text-purple-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{AUTH_MESSAGES.VERIFYING}</span>
                </div>
              )}

              {/* Forgot PIN Link */}
              <div className="text-center">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-600 transition-colors"
                  onClick={() => {
                    // TODO: Implement admin reset flow navigation
                    // For now, just show a helpful message
                    setError(AUTH_MESSAGES.FORGOT_PIN_HELP);
                  }}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {AUTH_MESSAGES.FORGOT_PIN}
                </button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && verifiedMember && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {AUTH_MESSAGES.VERIFICATION_SUCCESS}
              </h3>
              <p className="text-sm text-gray-500">
                Welcome, {verifiedMember.firstName}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'auth' && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, modalRoot);
}

export default PinVerificationModal;


