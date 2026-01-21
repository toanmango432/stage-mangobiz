/**
 * PasswordStep Component
 *
 * Password entry step for switch user modal.
 * Used for member-login context + online.
 */

import { Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getInitials, getRoleLabel, getRoleColor } from './utils';
import type { PasswordStepProps } from './types';

export function PasswordStep({
  selectedMember,
  password,
  showPassword,
  error,
  loading,
  passwordInputRef,
  onPasswordChange,
  onShowPasswordToggle,
  onSubmit,
}: PasswordStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Selected Member */}
      <div className="text-center">
        {selectedMember.avatarUrl ? (
          <img
            src={selectedMember.avatarUrl}
            alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
            className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
          />
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
            {getInitials(selectedMember)}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedMember.firstName} {selectedMember.lastName}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {selectedMember.email}
        </p>
        <p className={`text-xs font-medium px-3 py-1 rounded-full inline-block mt-2 ${getRoleColor(selectedMember.role)}`}>
          {getRoleLabel(selectedMember.role)}
        </p>
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter your password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={passwordInputRef}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              onPasswordChange(e.target.value);
            }}
            placeholder="Enter password"
            className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            disabled={loading}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={onShowPasswordToggle}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 mt-3 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !password}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </button>
    </form>
  );
}

export default PasswordStep;
