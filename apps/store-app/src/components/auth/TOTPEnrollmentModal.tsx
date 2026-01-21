/**
 * TOTPEnrollmentModal Component
 *
 * A modal for setting up TOTP (Time-based One-Time Password) authentication
 * using authenticator apps like Google Authenticator, 1Password, or Authy.
 *
 * Multi-step flow:
 * 1. Introduction - Explain TOTP and supported apps
 * 2. QR Code - Display QR code for scanning
 * 3. Verify - Enter 6-digit code from authenticator app
 * 4. Success - Confirmation message
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Loader2,
  CheckCircle,
  Smartphone,
  ArrowLeft,
  Copy,
  Check,
  QrCode,
  Shield,
} from 'lucide-react';
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
import { totpService, type TOTPEnrollmentData } from '@/services/totpService';
import { AUTH_TIMEOUTS } from './constants';

export interface TOTPEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'intro' | 'qrcode' | 'verify' | 'success';

const SUPPORTED_APPS = [
  { name: 'Google Authenticator', icon: '🔐' },
  { name: '1Password', icon: '🔑' },
  { name: 'Authy', icon: '📱' },
  { name: 'Microsoft Authenticator', icon: '🛡️' },
];

export function TOTPEnrollmentModal({
  isOpen,
  onClose,
  onSuccess,
}: TOTPEnrollmentModalProps) {
  const [step, setStep] = useState<Step>('intro');
  const [enrollmentData, setEnrollmentData] = useState<TOTPEnrollmentData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('intro');
      setEnrollmentData(null);
      setVerificationCode('');
      setError(null);
      setIsLoading(false);
      setShowSecret(false);
      setCopied(false);
    }
  }, [isOpen]);

  // Handle starting enrollment (QR code generation)
  const handleStartSetup = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await totpService.startEnrollment();
      setEnrollmentData(data);
      setStep('qrcode');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start enrollment');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle proceeding to verification step
  const handleProceedToVerify = useCallback(() => {
    setStep('verify');
    setVerificationCode('');
    setError(null);
  }, []);

  // Handle copying secret to clipboard
  const handleCopySecret = useCallback(async () => {
    if (!enrollmentData?.secret) return;

    try {
      await navigator.clipboard.writeText(enrollmentData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = enrollmentData.secret;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [enrollmentData?.secret]);

  // Handle verification code completion
  const handleVerifyCode = useCallback(async () => {
    if (!enrollmentData || verificationCode.length !== 6) return;

    setIsLoading(true);
    setError(null);

    try {
      await totpService.completeEnrollment(enrollmentData.factorId, verificationCode);
      setStep('success');

      // Close modal after success display
      setTimeout(() => {
        onSuccess();
        onClose();
      }, AUTH_TIMEOUTS.SUCCESS_DISPLAY_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setVerificationCode('');
    } finally {
      setIsLoading(false);
    }
  }, [enrollmentData, verificationCode, onSuccess, onClose]);

  // Handle going back
  const handleBack = useCallback(() => {
    if (step === 'verify') {
      setStep('qrcode');
    } else if (step === 'qrcode') {
      setStep('intro');
      setEnrollmentData(null);
    }
    setError(null);
  }, [step]);

  // Render step content
  const renderContent = () => {
    switch (step) {
      case 'intro':
        return (
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>

            <div className="text-center space-y-2">
              <p className="text-gray-700">
                Add an extra layer of security to your account
              </p>
              <p className="text-sm text-gray-500">
                Use an authenticator app to generate verification codes when you sign in.
              </p>
            </div>

            <div className="w-full bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Supported apps:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_APPS.map((app) => (
                  <div
                    key={app.name}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <span>{app.icon}</span>
                    <span>{app.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div className="w-full space-y-3 pt-2">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleStartSetup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Set up authenticator
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-700"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        );

      case 'qrcode':
        return (
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="text-center space-y-2">
              <p className="text-gray-700">
                Scan this QR code with your authenticator app
              </p>
              <p className="text-sm text-gray-500">
                Or enter the secret key manually below
              </p>
            </div>

            {/* QR Code Display */}
            {enrollmentData?.qrCode && (
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                <img
                  src={enrollmentData.qrCode}
                  alt="TOTP QR Code"
                  className="w-48 h-48"
                />
              </div>
            )}

            {/* Secret Key Toggle */}
            <div className="w-full">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? "Hide secret key" : "Can't scan? Show secret key"}
              </button>

              {showSecret && enrollmentData?.secret && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono text-gray-700 break-all">
                      {enrollmentData.secret}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={handleCopySecret}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Enter this key in your authenticator app
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div className="w-full space-y-3 pt-2">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleProceedToVerify}
              >
                Continue
              </Button>

              <Button
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-700"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>

            <div className="text-center space-y-2">
              <p className="text-gray-700">
                Enter the 6-digit code from your authenticator app
              </p>
              <p className="text-sm text-gray-500">
                This verifies your app is set up correctly
              </p>
            </div>

            <InputOTP
              maxLength={6}
              value={verificationCode}
              onChange={(value) => {
                setVerificationCode(value);
                setError(null);
              }}
              onComplete={handleVerifyCode}
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
                onClick={handleVerifyCode}
                disabled={verificationCode.length !== 6 || isLoading}
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
                Two-Factor Authentication Enabled
              </h3>
              <p className="text-sm text-gray-500">
                Your account is now protected with an authenticator app.
              </p>
            </div>
          </div>
        );
    }
  };

  const canClose = step !== 'success';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && canClose && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (step === 'success') {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (step === 'success') {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === 'success'
              ? 'Success'
              : 'Set Up Authenticator App'}
          </DialogTitle>
          {step !== 'success' && (
            <DialogDescription className="text-center">
              {step === 'intro' && 'Add two-factor authentication to your account'}
              {step === 'qrcode' && 'Scan the QR code with your authenticator app'}
              {step === 'verify' && 'Verify your authenticator app is working'}
            </DialogDescription>
          )}
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

export default TOTPEnrollmentModal;
