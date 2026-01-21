/**
 * PinSetupModal Component
 *
 * A modal for setting up a new PIN after first login or changing an existing PIN.
 * Features a two-step flow: Enter PIN → Confirm PIN.
 *
 * PIN setup is OPTIONAL for member-login users but recommended for quick
 * offline access. Users can skip setup and set it up later in Settings.
 *
 * @example
 * ```tsx
 * <PinSetupModal
 *   isOpen={showPinSetup}
 *   onClose={() => setShowPinSetup(false)}
 *   onSubmit={(pin) => console.log('PIN set:', pin)}
 *   onSkip={() => console.log('User skipped PIN setup')}
 *   memberId="member-123"
 *   memberName="John Smith"
 *   isRequired={false}
 * />
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { Loader2, CheckCircle, KeyRound, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { PinInput } from './PinInput';
import { memberAuthService } from '@/services/memberAuthService';
import { AUTH_MESSAGES, AUTH_TIMEOUTS } from './constants';
import { auditLogger } from '@/services/audit/auditLogger';
import { setSkipPreference, clearSkipPreference } from './pinSetupUtils';

/** Props for PinSetupModal component */
export interface PinSetupModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when PIN is successfully set */
  onSubmit: (pin: string) => void;
  /** Callback when user skips PIN setup (only available when isRequired=false) */
  onSkip?: () => void;
  /** Member ID to set PIN for */
  memberId: string;
  /** Member's display name for personalization */
  memberName: string;
  /** Whether PIN setup is required (default: false) */
  isRequired?: boolean;
}

type Step = 'enter' | 'confirm' | 'success';

/**
 * Modal component for setting up a new PIN.
 *
 * Two-step flow:
 * 1. Enter new PIN (4-6 digits)
 * 2. Confirm PIN by re-entering
 *
 * Optional skip functionality for member-login users.
 */
export function PinSetupModal({
  isOpen,
  onClose,
  onSubmit,
  onSkip,
  memberId,
  memberName,
  isRequired = false,
}: PinSetupModalProps) {
  // Two-step flow state
  const [step, setStep] = useState<Step>('enter');
  const [enteredPin, setEnteredPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('enter');
      setEnteredPin('');
      setConfirmPin('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle PIN entry in step 1
  const handlePinEntered = useCallback((pin: string) => {
    setEnteredPin(pin);
    setError(null);
  }, []);

  // Handle PIN entry complete in step 1
  const handlePinComplete = useCallback(() => {
    if (!memberAuthService.isValidPinFormat(enteredPin)) {
      setError(AUTH_MESSAGES.PIN_FORMAT_ERROR);
      return;
    }
    setStep('confirm');
    setConfirmPin('');
    setError(null);
  }, [enteredPin]);

  // Handle PIN confirmation in step 2
  const handleConfirmPinChange = useCallback((pin: string) => {
    setConfirmPin(pin);
    setError(null);
  }, []);

  // Handle final submission
  const handleConfirmComplete = useCallback(async () => {
    // Validate confirmation matches
    if (confirmPin !== enteredPin) {
      setError(AUTH_MESSAGES.PIN_MISMATCH_ERROR);
      setConfirmPin('');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call memberAuthService to set the PIN
      await memberAuthService.setPin(memberId, enteredPin);

      // Clear any skip preference since user set up PIN
      clearSkipPreference(memberId);

      // Show success step
      setStep('success');

      // Close modal after brief success display
      setTimeout(() => {
        onSubmit(enteredPin);
        onClose();
      }, AUTH_TIMEOUTS.SUCCESS_DISPLAY_MS);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      auditLogger.log({
        action: 'login',
        entityType: 'member',
        entityId: memberId,
        description: 'PIN setup failed',
        severity: 'medium',
        success: false,
        errorMessage,
        metadata: {
          operation: 'pinSetup',
          memberName,
        },
      });
      setError(err instanceof Error ? err.message : AUTH_MESSAGES.PIN_SET_FAILED);
      setIsLoading(false);
    }
  }, [confirmPin, enteredPin, memberId, memberName, onSubmit, onClose]);

  // Handle going back to step 1
  const handleBack = useCallback(() => {
    setStep('enter');
    setConfirmPin('');
    setError(null);
  }, []);

  // Handle skip
  const handleSkip = useCallback(() => {
    setSkipPreference(memberId);
    onSkip?.();
    onClose();
  }, [memberId, onSkip, onClose]);

  // Determine if close button should be visible
  const canClose = !isRequired && step !== 'success';

  // Render step content
  const renderContent = () => {
    switch (step) {
      case 'enter':
        return (
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-purple-600" />
            </div>

            <div className="text-center space-y-2">
              <p className="text-gray-700">
                Hi <span className="font-medium">{memberName}</span>, create a PIN for quick access.
              </p>
              <p className="text-sm text-gray-500">
                Enter a 4-6 digit PIN you&apos;ll remember.
              </p>
            </div>

            <PinInput
              value={enteredPin}
              onChange={handlePinEntered}
              length={6}
              autoFocus
              error={!!error}
              onComplete={handlePinComplete}
            />

            {error && (
              <p className="text-sm text-red-600 text-center">
                {error}
              </p>
            )}

            <div className="w-full space-y-3 pt-2">
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handlePinComplete}
                disabled={enteredPin.length < 4}
              >
                Continue
              </Button>

              {!isRequired && onSkip && (
                <Button
                  variant="ghost"
                  className="w-full text-gray-500 hover:text-gray-700"
                  onClick={handleSkip}
                >
                  Skip for now
                </Button>
              )}
            </div>

            {!isRequired && (
              <p className="text-xs text-gray-400 text-center max-w-xs">
                PIN enables quick access on this device. You can set it up later in Settings.
              </p>
            )}
          </div>
        );

      case 'confirm':
        return (
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-purple-600" />
            </div>

            <div className="text-center space-y-2">
              <p className="text-gray-700">
                Confirm your PIN
              </p>
              <p className="text-sm text-gray-500">
                Re-enter your PIN to confirm.
              </p>
            </div>

            <PinInput
              value={confirmPin}
              onChange={handleConfirmPinChange}
              length={6}
              autoFocus
              error={!!error}
              onComplete={handleConfirmComplete}
            />

            {error && (
              <p className="text-sm text-red-600 text-center">
                {error}
              </p>
            )}

            <div className="w-full space-y-3 pt-2">
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleConfirmComplete}
                disabled={confirmPin.length < 4 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Setting PIN...
                  </>
                ) : (
                  'Set PIN'
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-700"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center space-y-6 py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {AUTH_MESSAGES.PIN_SET_SUCCESS}
              </h3>
              <p className="text-sm text-gray-500">
                {AUTH_MESSAGES.PIN_SET_SUCCESS_DETAIL}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && canClose && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        // Hide close button when required or during success
        onInteractOutside={(e) => {
          if (isRequired || step === 'success') {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isRequired || step === 'success') {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === 'success' ? AUTH_MESSAGES.SUCCESS_TITLE : AUTH_MESSAGES.PIN_SETUP_TITLE}
          </DialogTitle>
          {step !== 'success' && (
            <DialogDescription className="text-center">
              {isRequired
                ? AUTH_MESSAGES.PIN_SETUP_REQUIRED
                : AUTH_MESSAGES.PIN_SETUP_OPTIONAL}
            </DialogDescription>
          )}
        </DialogHeader>

        {renderContent()}

        {/* Custom close button when not required (DialogContent has built-in X) */}
        {!canClose && step !== 'success' && (
          <DialogFooter className="sm:justify-center">
            <p className="text-xs text-gray-400">
              {AUTH_MESSAGES.PIN_SETUP_REQUIRED_FOOTER}
            </p>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PinSetupModal;
