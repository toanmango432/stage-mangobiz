/**
 * Manager PIN Verification Modal
 *
 * A simplified PIN modal for manager-level authentication.
 * Used for sensitive actions like status reversals.
 *
 * Features:
 * - 4-digit masked PIN input
 * - Shake animation on invalid PIN
 * - Max 3 attempts before lockout
 * - Dev mode: accepts '1234' as valid PIN
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ManagerPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with manager ID on successful verification */
  onSuccess: (managerId: string) => void;
  /** Called when user cancels */
  onCancel?: () => void;
  title?: string;
  description?: string;
}

// Dev PIN for development - in production this would be validated via API
const DEV_MANAGER_PIN = '1234';
const MAX_ATTEMPTS = 3;

export function ManagerPinModal({
  isOpen,
  onClose,
  onSuccess,
  onCancel,
  title = 'Manager Verification',
  description = 'Enter manager PIN to continue',
}: ManagerPinModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPin(['', '', '', '']);
      setError(null);
      setAttempts(0);
      setIsLocked(false);
      setIsSuccess(false);
      setShake(false);
    }
  }, [isOpen]);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const handlePinSubmit = useCallback(async (enteredPin: string) => {
    if (enteredPin.length !== 4 || isLocked) return;

    setIsVerifying(true);
    setError(null);

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Dev mode: accept hardcoded PIN
    if (enteredPin === DEV_MANAGER_PIN) {
      setIsSuccess(true);
      setIsVerifying(false);

      // Brief success feedback then close
      setTimeout(() => {
        onSuccess('manager-1'); // Hardcoded manager ID for dev
        onClose();
      }, 500);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setIsVerifying(false);

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setError('Maximum attempts reached');
      } else {
        setError(`Invalid PIN (${MAX_ATTEMPTS - newAttempts} attempts remaining)`);
        triggerShake();
      }

      // Clear PIN on failure
      setPin(['', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [attempts, isLocked, onSuccess, onClose, triggerShake]);

  const handlePinChange = useCallback((index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    if (isLocked) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(null);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3) {
      const fullPin = newPin.join('');
      if (fullPin.length === 4) {
        handlePinSubmit(fullPin);
      }
    }
  }, [pin, isLocked, handlePinSubmit]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      const enteredPin = pin.join('');
      if (enteredPin.length === 4) {
        handlePinSubmit(enteredPin);
      }
    }
  }, [pin, handlePinSubmit]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData) {
      const newPin = ['', '', '', ''];
      pastedData.split('').forEach((digit, i) => {
        if (i < 4) newPin[i] = digit;
      });
      setPin(newPin);
      setError(null);

      if (pastedData.length === 4) {
        handlePinSubmit(pastedData);
      } else {
        const lastIndex = pastedData.length - 1;
        if (lastIndex >= 0 && lastIndex < 4) {
          inputRefs.current[lastIndex + 1]?.focus();
        }
      }
    }
  }, [isLocked, handlePinSubmit]);

  const handleClose = useCallback(() => {
    onCancel?.();
    onClose();
  }, [onCancel, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isSuccess ? 'bg-green-100' : isLocked ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              {isSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : isLocked ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Success State */}
          {isSuccess && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-green-600 font-medium">Verified</p>
            </div>
          )}

          {/* Locked State */}
          {isLocked && !isSuccess && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-sm text-red-600 font-medium mb-2">
                Too many attempts
              </p>
              <p className="text-xs text-gray-500">
                Please contact a manager for assistance
              </p>
            </div>
          )}

          {/* PIN Input State */}
          {!isSuccess && !isLocked && (
            <div className="space-y-4">
              {/* PIN Input */}
              <div
                className={`flex justify-center gap-3 ${shake ? 'animate-shake' : ''}`}
                onPaste={handlePaste}
              >
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    disabled={isVerifying}
                    className={`
                      w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                      transition-all
                      ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                      ${digit ? 'bg-amber-50 border-amber-300' : 'bg-gray-50'}
                      disabled:opacity-50
                    `}
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Loading Indicator */}
              {isVerifying && (
                <div className="flex items-center justify-center gap-2 text-amber-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Verifying...</span>
                </div>
              )}

              {/* Help Text */}
              {!error && !isVerifying && (
                <p className="text-xs text-gray-400 text-center">
                  Enter 4-digit manager PIN
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </DialogContent>

      {/* Add shake animation styles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </Dialog>
  );
}

export default ManagerPinModal;
