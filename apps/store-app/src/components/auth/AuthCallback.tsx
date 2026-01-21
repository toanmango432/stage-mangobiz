/**
 * AuthCallback Component
 *
 * Handles the callback from Supabase magic link authentication.
 * This component is rendered when the user clicks the login link in their email.
 *
 * Flow:
 * 1. User clicks magic link in email
 * 2. Supabase redirects to /auth/callback with tokens in URL
 * 3. This component verifies the session
 * 4. On success, redirects to main app
 * 5. On failure, shows error with retry option
 */

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { memberAuthService } from '@/services/memberAuthService';

interface AuthCallbackProps {
  onSuccess: () => void;
  onError?: (error: string) => void;
}

export function AuthCallback({ onSuccess, onError }: AuthCallbackProps) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function verifySession() {
      try {
        // Verify the magic link session
        // Supabase automatically handles the URL token exchange
        await memberAuthService.verifyMagicLinkSession();

        setStatus('success');

        // Short delay to show success message, then redirect
        setTimeout(() => {
          // Clear the URL hash/query params to prevent re-verification on refresh
          window.history.replaceState({}, document.title, window.location.pathname.replace('/auth/callback', '/'));
          onSuccess();
        }, 1500);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Authentication failed';
        setStatus('error');
        setErrorMessage(message);
        onError?.(message);
      }
    }

    verifySession();
  }, [onSuccess, onError]);

  const handleRetry = () => {
    // Redirect to login page
    window.history.replaceState({}, document.title, '/');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-amber-500 rounded-2xl flex items-center justify-center">
            <Mail className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Verifying State */}
        {status === 'verifying' && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Verifying Login</h1>
              <p className="text-gray-600 mt-2">Please wait while we sign you in...</p>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome Back!</h1>
              <p className="text-gray-600 mt-2">Redirecting to your dashboard...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Login Failed</h1>
              <p className="text-gray-600 mt-2">{errorMessage}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                The login link may have expired or already been used. Magic links are single-use and expire after 24 hours.
              </p>
            </div>

            <button
              onClick={handleRetry}
              className="w-full py-3 px-4 bg-gradient-to-r from-brand-500 to-amber-500 text-white rounded-lg font-medium hover:from-brand-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
