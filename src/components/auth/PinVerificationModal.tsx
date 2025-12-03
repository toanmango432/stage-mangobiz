/**
 * Staff Authentication Modal
 *
 * Supports multiple authentication methods simultaneously:
 * - PIN: 4-6 digit numeric code (manual entry)
 * - Staff Card: NFC/magnetic stripe card scan (auto-detected)
 *
 * The modal listens for rapid keyboard input (card swipe) while
 * also accepting manual PIN entry. Card readers typically send
 * data as rapid keystrokes followed by Enter.
 *
 * Two modes based on auth state:
 *
 * 1. STORE-ONLY MODE (store logged in, no member):
 *    - PIN/Card identifies WHO is performing the action
 *    - Any valid staff PIN/Card works
 *    - Returns the verified member info for audit trail
 *
 * 2. MEMBER MODE (member logged in):
 *    - PIN/Card confirms it's really the logged-in member
 *    - Only that member's credentials work
 *    - Used for sensitive actions within their session
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, ShieldCheck, User, CreditCard } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { selectMember, selectStoreId } from '../../store/slices/authSlice';
import { authService } from '../../services/supabase/authService';

export interface VerifiedMember {
  memberId: string;
  memberName: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with verified member info (for audit trail) */
  onSuccess: (verifiedMember?: VerifiedMember) => void;
  title?: string;
  description?: string;
  /** If true, only the current member's PIN is accepted (even in store-only mode) */
  requireCurrentMember?: boolean;
  /** Enable card scan detection (default: true) */
  enableCardScan?: boolean;
}

type Step = 'auth' | 'success';

// Card reader detection settings
const CARD_INPUT_TIMEOUT = 100; // ms - if keys come faster than this, it's likely a card reader
const CARD_MIN_LENGTH = 4; // Minimum length to consider as card input

export function PinVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Staff Authentication',
  description,
  requireCurrentMember = false,
  enableCardScan = true,
}: PinVerificationModalProps) {
  const currentMember = useAppSelector(selectMember);
  const storeId = useAppSelector(selectStoreId);

  // Determine mode based on auth state
  const isStoreOnlyMode = !currentMember && !!storeId;
  const isMemberMode = !!currentMember;

  const [step, setStep] = useState<Step>('auth');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedMember, setVerifiedMember] = useState<VerifiedMember | null>(null);
  const [cardScanActive, setCardScanActive] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Card reader detection
  const cardBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const cardTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic description
  const displayDescription = description || (
    isMemberMode
      ? 'Confirm your identity'
      : 'Enter your PIN or scan your staff card'
  );

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('auth');
      setPin(['', '', '', '', '', '']);
      setError(null);
      setVerifiedMember(null);
      setCardScanActive(false);
      cardBufferRef.current = '';
      if (cardTimeoutRef.current) {
        clearTimeout(cardTimeoutRef.current);
      }
    }
  }, [isOpen]);

  // Global keyboard listener for card reader detection
  useEffect(() => {
    if (!isOpen || !enableCardScan || step !== 'auth' || loading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If Enter key and we have buffered card data
      if (e.key === 'Enter' && cardBufferRef.current.length >= CARD_MIN_LENGTH) {
        e.preventDefault();
        const cardData = cardBufferRef.current;
        cardBufferRef.current = '';
        setCardScanActive(false);
        handleCardSubmit(cardData);
        return;
      }

      // Detect rapid input (card reader behavior)
      if (timeSinceLastKey < CARD_INPUT_TIMEOUT && e.key.length === 1) {
        // This looks like card reader input
        cardBufferRef.current += e.key;
        setCardScanActive(true);

        // Clear any existing timeout
        if (cardTimeoutRef.current) {
          clearTimeout(cardTimeoutRef.current);
        }

        // Set timeout to clear buffer if no more rapid input
        cardTimeoutRef.current = setTimeout(() => {
          if (cardBufferRef.current.length >= CARD_MIN_LENGTH) {
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
        }, 300);

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

  // Handle success - common flow for both PIN and Card
  const handleAuthSuccess = useCallback((memberSession: { memberId: string; firstName: string; lastName: string; role: string }) => {
    const verified: VerifiedMember = {
      memberId: memberSession.memberId,
      memberName: `${memberSession.firstName} ${memberSession.lastName}`.trim(),
      firstName: memberSession.firstName,
      lastName: memberSession.lastName,
      role: memberSession.role,
    };

    setVerifiedMember(verified);
    setStep('success');

    setTimeout(() => {
      onSuccess(verified);
      onClose();
    }, 800);
  }, [onSuccess, onClose]);

  // Handle PIN submission
  const handlePinSubmit = useCallback(async (enteredPin?: string) => {
    const pinToVerify = enteredPin || pin.join('');
    if (pinToVerify.length < 4) return;

    setLoading(true);
    setError(null);

    try {
      if (isStoreOnlyMode && storeId && !requireCurrentMember) {
        const memberSession = await authService.loginMemberWithPin(storeId, pinToVerify);
        handleAuthSuccess(memberSession);
      } else if (currentMember) {
        const isValid = await authService.verifyMemberPin(
          currentMember.memberId,
          pinToVerify
        );

        if (isValid) {
          handleAuthSuccess({
            memberId: currentMember.memberId,
            firstName: currentMember.firstName,
            lastName: currentMember.lastName,
            role: currentMember.role,
          });
        } else {
          setError('Invalid PIN');
          setPin(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      } else if (storeId) {
        const memberSession = await authService.loginMemberWithPin(storeId, pinToVerify);
        handleAuthSuccess(memberSession);
      } else {
        setError('Store not connected');
      }
    } catch (err: unknown) {
      console.error('PIN verification failed:', err);
      const authError = err as { code?: string };
      const message = authError.code === 'INVALID_PIN'
        ? 'Invalid PIN'
        : 'Verification failed. Please try again.';
      setError(message);
      setPin(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [pin, isStoreOnlyMode, storeId, requireCurrentMember, currentMember, handleAuthSuccess]);

  // Handle Card submission
  const handleCardSubmit = useCallback(async (cardId: string) => {
    if (!cardId.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (!storeId) {
        setError('Store not connected');
        setLoading(false);
        return;
      }

      const memberSession = await authService.verifyMemberCard(storeId, cardId.trim());

      if (memberSession) {
        handleAuthSuccess(memberSession);
      } else {
        setError('Card not recognized');
        inputRefs.current[0]?.focus();
      }
    } catch (err: unknown) {
      console.error('Card verification failed:', err);
      setError('Card not recognized');
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [storeId, handleAuthSuccess]);

  const handlePinChange = useCallback((index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4+ digits entered
    const enteredPin = newPin.join('');
    if (enteredPin.length >= 4 && !newPin.slice(0, 4).includes('')) {
      const hasMoreDigits = newPin.slice(4).some(d => d !== '');
      if (!hasMoreDigits && index === 3) {
        handlePinSubmit(enteredPin.slice(0, 4));
      } else if (enteredPin.length === 6) {
        handlePinSubmit(enteredPin);
      }
    }
  }, [pin, handlePinSubmit]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      const enteredPin = pin.join('');
      if (enteredPin.length >= 4) {
        handlePinSubmit(enteredPin);
      }
    }
  }, [pin, handlePinSubmit]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newPin = ['', '', '', '', '', ''];
      pastedData.split('').forEach((digit, i) => {
        if (i < 6) newPin[i] = digit;
      });
      setPin(newPin);
      setError(null);

      const lastIndex = pastedData.length - 1;
      if (lastIndex >= 0 && lastIndex < 6) {
        inputRefs.current[lastIndex]?.focus();
      }

      if (pastedData.length >= 4) {
        handlePinSubmit(pastedData);
      }
    }
  }, [handlePinSubmit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
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
              {/* Member Mode: Show current member */}
              {isMemberMode && currentMember && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                    {currentMember.firstName?.[0]}{currentMember.lastName?.[0]}
                  </div>
                  <p className="text-sm text-gray-600">
                    {currentMember.firstName} {currentMember.lastName}
                  </p>
                </div>
              )}

              {/* Store-Only Mode: Show generic icon */}
              {!isMemberMode && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white mx-auto mb-3">
                    <User className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Staff Authentication
                  </p>
                </div>
              )}

              {/* Description */}
              <p className="text-sm text-gray-500 text-center">
                {displayDescription}
              </p>

              {/* PIN Input */}
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    disabled={loading || cardScanActive}
                    className={`
                      w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                      transition-all
                      ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                      ${digit ? 'bg-purple-50 border-purple-300' : 'bg-gray-50'}
                      ${index >= 4 ? 'opacity-50' : ''}
                      ${cardScanActive ? 'opacity-50' : ''}
                    `}
                    style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                  />
                ))}
              </div>

              {/* Card Scan Indicator */}
              {enableCardScan && (
                <div className={`flex items-center justify-center gap-2 transition-all ${cardScanActive ? 'text-purple-600' : 'text-gray-400'}`}>
                  <CreditCard className={`w-4 h-4 ${cardScanActive ? 'animate-pulse' : ''}`} />
                  <span className="text-xs">
                    {cardScanActive ? 'Reading card...' : 'or scan staff card'}
                  </span>
                  {!cardScanActive && (
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-center justify-center gap-2 text-purple-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Verifying...</span>
                </div>
              )}

              {/* Help Text */}
              {!enableCardScan && (
                <p className="text-xs text-gray-400 text-center">
                  Enter your 4-6 digit security PIN
                </p>
              )}
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && verifiedMember && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Verified
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
}

export default PinVerificationModal;
