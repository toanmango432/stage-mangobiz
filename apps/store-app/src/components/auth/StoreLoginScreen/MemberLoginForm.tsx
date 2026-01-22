/**
 * MemberLoginForm Component
 *
 * Member login form with email and password fields.
 * Uses Supabase Auth for individual staff authentication.
 * Supports passwordless magic link login.
 */

import { User, Loader2, AlertCircle, CheckCircle2, Mail, Lock, Eye, EyeOff, Send, Fingerprint, ScanFace } from 'lucide-react';
import type { MemberLoginFormProps } from './types';

/**
 * Get the appropriate biometric icon based on type
 */
function BiometricIcon({ type, className }: { type?: string; className?: string }) {
  if (type === 'face') {
    return <ScanFace className={className} />;
  }
  return <Fingerprint className={className} />;
}

export function MemberLoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  onShowPasswordToggle,
  isLoading,
  error,
  success,
  onLogin,
  onKeyDown,
  isOnline,
  onForgotPassword,
  // Magic Link props
  onSendMagicLink,
  magicLinkSent,
  magicLinkEmail,
  magicLinkCooldown = 0,
  isSendingMagicLink,
  // Biometric props
  biometricAvailable,
  biometricType,
  biometricPlatformName,
  biometricEnabled,
  onBiometricLogin,
  isBiometricLoading,
}: MemberLoginFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Biometric Login Button - Show when biometric is enabled for user */}
      {biometricAvailable && biometricEnabled && onBiometricLogin && (
        <>
          <button
            type="button"
            onClick={onBiometricLogin}
            disabled={isBiometricLoading || isLoading}
            className="w-full py-4 px-4 bg-gradient-to-r from-brand-500 to-amber-500 text-white rounded-lg font-medium hover:from-brand-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-3"
          >
            {isBiometricLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <BiometricIcon type={biometricType} className="w-6 h-6" />
                <span>Sign in with {biometricPlatformName || 'Biometrics'}</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center my-2">
            <div className="flex-grow border-t border-gray-200" />
            <span className="flex-shrink mx-3 text-sm text-gray-400">or use password</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>
        </>
      )}

      <div>
        <label htmlFor="member-email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="member-email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="you@example.com"
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            autoFocus
          />
        </div>
      </div>

      <div>
        <label htmlFor="member-password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="member-password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Enter your password"
            disabled={isLoading}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={onShowPasswordToggle}
            disabled={isLoading}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {/* Forgot Password link - only visible when online */}
        {isOnline && onForgotPassword && (
          <div className="flex justify-end mt-1.5">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200" role="status">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !email.trim() || !password.trim()}
        className="w-full py-3 px-4 bg-gradient-to-r from-brand-500 to-amber-500 text-white rounded-lg font-medium hover:from-brand-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <User className="w-5 h-5" />
            <span>Sign In</span>
          </>
        )}
      </button>

      {/* Magic Link Section - Only show when online */}
      {isOnline && onSendMagicLink && (
        <>
          {/* Divider */}
          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-gray-200" />
            <span className="flex-shrink mx-3 text-sm text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>

          {/* Magic Link Sent State */}
          {magicLinkSent ? (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Check your email</p>
                  <p className="text-sm text-green-500">
                    We sent a login link to <span className="font-medium">{magicLinkEmail}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onSendMagicLink}
                disabled={isSendingMagicLink || magicLinkCooldown > 0}
                className="text-sm text-brand-600 hover:text-brand-700 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
              >
                {isSendingMagicLink ? (
                  'Sending...'
                ) : magicLinkCooldown > 0 ? (
                  `Resend in ${magicLinkCooldown}s`
                ) : (
                  'Resend link'
                )}
              </button>
            </div>
          ) : (
            /* Magic Link Button */
            <button
              type="button"
              onClick={onSendMagicLink}
              disabled={isSendingMagicLink || !email.trim() || isLoading}
              className="w-full py-3 px-4 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSendingMagicLink ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Email me a login link</span>
                </>
              )}
            </button>
          )}
        </>
      )}
    </form>
  );
}

export default MemberLoginForm;
