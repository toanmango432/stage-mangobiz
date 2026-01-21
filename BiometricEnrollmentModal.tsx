/**
 * BiometricEnrollmentModal Component
 *
 * Prompts users to enable biometric login (Face ID, Touch ID, Windows Hello)
 * after successful password authentication.
 *
 * Features:
 * - Shows appropriate icon based on biometric type
 * - "Enable" - Registers WebAuthn credential
 * - "Not now" - Skips for this session
 * - "Don't ask again" - Permanently dismisses prompt
 */

import { useState } from 'react';
import { Fingerprint, ScanFace, Loader2, X, Shield } from 'lucide-react';
import { biometricService } from '@/services/biometricService';

const BIOMETRIC_DISMISSED_KEY = 'mango_biometric_dismissed';

interface BiometricEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: () => void;
  memberId: string;
  memberName: string;
  biometricType?: 'face' | 'fingerprint' | 'unknown' | 'none';
  platformName?: string;
}

/**
 * Check if user has dismissed biometric enrollment permanently
 */
export function hasDismissedBiometricEnrollment(memberId: string): boolean {
  const dismissed = localStorage.getItem(`${BIOMETRIC_DISMISSED_KEY}_${memberId}`);
  return dismissed === 'true';
}

/**
 * Mark biometric enrollment as dismissed for a user
 */
export function dismissBiometricEnrollment(memberId: string): void {
  localStorage.setItem(`${BIOMETRIC_DISMISSED_KEY}_${memberId}`, 'true');
}

/**
 * Get the appropriate icon for the biometric type
 */
function BiometricIcon({ type, className }: { type?: string; className?: string }) {
  if (type === 'face') {
    return <ScanFace className={className} />;
  }
  return <Fingerprint className={className} />;
}

export function BiometricEnrollmentModal({
  isOpen,
  onClose,
  onEnroll,
  memberId,
  memberName,
  biometricType = 'unknown',
  platformName = 'Biometrics',
}: BiometricEnrollmentModalProps) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEnable = async () => {
    setIsEnrolling(true);
    setError(null);

    try {
      // Register biometric credential (WebAuthn on web, native on iOS/Android)
      const success = await biometricService.register(memberId, memberName);

      if (!success) {
        throw new Error('Failed to register biometric credential');
      }

      // Store this user as the last biometric user for quick login
      biometricService.setLastBiometricUser(memberId);

      // Success - close modal and notify parent
      onEnroll();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable biometric login';
      setError(message);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleNotNow = () => {
    onClose();
  };

  const handleDontAskAgain = () => {
    dismissBiometricEnrollment(memberId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleNotNow}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleNotNow}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-amber-500 rounded-2xl flex items-center justify-center">
            <BiometricIcon type={biometricType} className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Enable {platformName}?
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center text-sm mb-6">
          Sign in faster next time using {platformName} instead of your password.
        </p>

        {/* Security note */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Your biometric data never leaves your device. We only store a secure credential that verifies your identity.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleEnable}
            disabled={isEnrolling}
            className="w-full py-3 px-4 bg-gradient-to-r from-brand-500 to-amber-500 text-white rounded-lg font-medium hover:from-brand-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            {isEnrolling ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Setting up...</span>
              </>
            ) : (
              <>
                <BiometricIcon type={biometricType} className="w-5 h-5" />
                <span>Enable {platformName}</span>
              </>
            )}
          </button>

          <button
            onClick={handleNotNow}
            disabled={isEnrolling}
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Not now
          </button>

          <button
            onClick={handleDontAskAgain}
            disabled={isEnrolling}
            className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            Don't ask again
          </button>
        </div>
      </div>
    </div>
  );
}

export default BiometricEnrollmentModal;
