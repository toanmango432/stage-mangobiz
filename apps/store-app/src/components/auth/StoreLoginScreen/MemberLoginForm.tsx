/**
 * MemberLoginForm Component
 *
 * Member login form with email and password fields.
 * Uses Supabase Auth for individual staff authentication.
 */

import { User, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import type { MemberLoginFormProps } from './types';

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
}: MemberLoginFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="member-email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="member-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="you@example.com"
          disabled={isLoading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoFocus
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="member-password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          {/* Forgot Password link - only visible when online */}
          {isOnline && onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-brand-600 hover:text-brand-700 hover:underline"
            >
              Forgot Password?
            </button>
          )}
        </div>
        <div className="relative">
          <input
            id="member-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Enter your password"
            disabled={isLoading}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={onShowPasswordToggle}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <button
        onClick={onLogin}
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
    </div>
  );
}

export default MemberLoginForm;
