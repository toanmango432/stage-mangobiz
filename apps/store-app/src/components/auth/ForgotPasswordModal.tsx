/**
 * ForgotPasswordModal Component
 *
 * A modal for initiating the password reset flow via Supabase Auth.
 * User enters their email address and receives a reset link.
 *
 * @example
 * ```tsx
 * <ForgotPasswordModal
 *   isOpen={showForgotPassword}
 *   onClose={() => setShowForgotPassword(false)}
 *   defaultEmail="user@example.com"
 * />
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/services/supabase/client';

/** Props for ForgotPasswordModal component */
export interface ForgotPasswordModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Pre-filled email address (optional) */
  defaultEmail?: string;
}

type Step = 'email' | 'success';

/**
 * Modal component for initiating password reset.
 *
 * Flow:
 * 1. User enters email address
 * 2. Supabase sends password reset email
 * 3. Success message displayed
 */
export function ForgotPasswordModal({
  isOpen,
  onClose,
  defaultEmail = '',
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens/closes and sync default email
  useEffect(() => {
    if (isOpen) {
      setStep('email');
      setEmail(defaultEmail);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, defaultEmail]);

  // Handle email input change
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          // Redirect URL after password reset - adjust to your app URL
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (resetError) {
        // Supabase doesn't reveal if email exists for security reasons
        // So most "errors" are actually rate limiting or network issues
        setError(resetError.message);
        setIsLoading(false);
      } else {
        // Success - show confirmation
        setStep('success');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to send reset email:', err);
      setError('Failed to send reset email. Please try again.');
      setIsLoading(false);
    }
  }, [email]);

  // Handle key press (Enter to submit)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSubmit();
    }
  }, [isLoading, handleSubmit]);

  // Render step content
  const renderContent = () => {
    switch (step) {
      case 'email':
        return (
          <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-6 py-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>

            <div className="text-center space-y-2">
              <p className="text-gray-700">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            <div className="w-full space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onKeyDown={handleKeyDown}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="w-full space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600"
                disabled={!email.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-700"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center space-y-6 py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Check Your Email
              </h3>
              <p className="text-sm text-gray-600 max-w-xs">
                We&apos;ve sent a password reset link to <span className="font-medium">{email}</span>
              </p>
              <p className="text-xs text-gray-400 pt-2">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
            </div>

            <div className="w-full pt-2">
              <Button
                className="w-full bg-brand-500 hover:bg-brand-600"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === 'success' ? 'Email Sent' : 'Reset Password'}
          </DialogTitle>
          {step !== 'success' && (
            <DialogDescription className="text-center">
              We&apos;ll help you get back into your account.
            </DialogDescription>
          )}
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

export default ForgotPasswordModal;
