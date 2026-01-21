/**
 * OTPVerificationModal Component
 *
 * A modal for verifying OTP (One-Time Password) codes sent via email or SMS.
 * Used during login when the user has email_otp or sms_otp MFA enabled.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2, Mail, Smartphone, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { otpService, OTP_CODE_LENGTH, OTP_EXPIRY_SECONDS } from '@/services/otpService';

export interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  method: 'email_otp' | 'sms_otp';
  destination: string; // Masked email or phone for display
}

export function OTPVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  method,
  destination,
}: OTPVerificationModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(OTP_EXPIRY_SECONDS);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start expiry countdown
  useEffect(() => {
    if (isOpen) {
      setExpirySeconds(OTP_EXPIRY_SECONDS);
      expiryRef.current = setInterval(() => {
        setExpirySeconds(prev => {
          if (prev <= 1) {
            if (expiryRef.current) clearInterval(expiryRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (expiryRef.current) clearInterval(expiryRef.current);
    };
  }, [isOpen]);

  // Check cooldown on mount
  useEffect(() => {
    if (isOpen) {
      const remaining = otpService.getCooldownRemaining();
      if (remaining > 0) {
        setCooldownSeconds(remaining);
        cooldownRef.current = setInterval(() => {
          setCooldownSeconds(prev => {
            if (prev <= 1) {
              if (cooldownRef.current) clearInterval(cooldownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [isOpen]);

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === OTP_CODE_LENGTH && !isVerifying) {
      handleVerify();
    }
  }, [code]);

  const handleVerify = useCallback(async () => {
    if (code.length !== OTP_CODE_LENGTH) {
      setError('Please enter the complete code');
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      const isValid = await otpService.verifyOtp(code);
      if (isValid) {
        onSuccess();
      } else {
        setError('Invalid code. Please try again.');
        setCode('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  }, [code, onSuccess]);

  const handleResend = useCallback(async () => {
    if (cooldownSeconds > 0) return;

    setError(null);
    setIsResending(true);

    try {
      await otpService.resendOtp();
      // Reset expiry timer
      setExpirySeconds(OTP_EXPIRY_SECONDS);
      // Start cooldown
      setCooldownSeconds(otpService.OTP_COOLDOWN_SECONDS);
      cooldownRef.current = setInterval(() => {
        setCooldownSeconds(prev => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      setError(message);
    } finally {
      setIsResending(false);
    }
  }, [cooldownSeconds]);

  const handleClose = useCallback(() => {
    setCode('');
    setError(null);
    otpService.clearChallenge();
    onClose();
  }, [onClose]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const Icon = method === 'email_otp' ? Mail : Smartphone;
  const methodLabel = method === 'email_otp' ? 'email' : 'phone';

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            Enter verification code
          </DialogTitle>
          <DialogDescription className="text-center">
            We sent a {OTP_CODE_LENGTH}-digit code to your {methodLabel}
            <br />
            <span className="font-medium text-gray-700">{destination}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* OTP Input */}
          <div className="flex justify-center">
            <InputOTP
              maxLength={OTP_CODE_LENGTH}
              value={code}
              onChange={setCode}
            >
              <InputOTPGroup>
                {Array.from({ length: OTP_CODE_LENGTH }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          {/* Expiry warning */}
          {expirySeconds > 0 && expirySeconds <= 60 && (
            <p className="text-sm text-amber-600 text-center">
              Code expires in {formatTime(expirySeconds)}
            </p>
          )}

          {expirySeconds === 0 && (
            <p className="text-sm text-red-600 text-center">
              Code has expired. Please request a new one.
            </p>
          )}

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={code.length !== OTP_CODE_LENGTH || isVerifying || expirySeconds === 0}
            className="w-full py-3 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </button>

          {/* Resend option */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={cooldownSeconds > 0 || isResending}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-1 mx-auto"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sending...
                </>
              ) : cooldownSeconds > 0 ? (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Resend in {cooldownSeconds}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Resend code
                </>
              )}
            </button>
          </div>

          {/* Cancel */}
          <button
            onClick={handleClose}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OTPVerificationModal;
