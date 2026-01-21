/**
 * TOTPVerificationModal Component
 *
 * A modal for verifying TOTP codes during login.
 * Shown after password authentication when user has TOTP enabled.
 */

import { useState, useCallback, useEffect } from 'react';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { totpService } from '@/services/totpService';

export interface TOTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function TOTPVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  onCancel,
}: TOTPVerificationModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle code verification
  const handleVerify = useCallback(async () => {
    if (code.length !== 6) return;

    setIsLoading(true);
    setError(null);

    try {
      await totpService.verifyCode(code);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  }, [code, onSuccess]);

  // Handle cancel (return to login)
  const handleCancel = useCallback(() => {
    onCancel?.();
    onClose();
  }, [onCancel, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter the code from your authenticator app
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              Open your authenticator app and enter the 6-digit code
            </p>
          </div>

          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => {
              setCode(value);
              setError(null);
            }}
            onComplete={handleVerify}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <div className="w-full space-y-3 pt-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleVerify}
              disabled={code.length !== 6 || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full text-gray-500 hover:text-gray-700"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Lost access to your authenticator app? Contact your administrator.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TOTPVerificationModal;
