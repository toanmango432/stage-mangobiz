/**
 * LoginForm Component
 *
 * Store login form with Store ID/Email and password fields.
 * Used for shared POS device authentication.
 */

import { Store, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { LoginFormProps } from './types';

export function LoginForm({
  storeId,
  setStoreId,
  password,
  setPassword,
  isLoading,
  error,
  success,
  onLogin,
  onKeyDown,
  compact,
}: LoginFormProps) {
  return (
    <div className={`space-y-4 ${compact ? 'space-y-3' : ''}`}>
      <div>
        <label htmlFor="store-id" className="block text-sm font-medium text-gray-700 mb-2">
          Store ID or Email
        </label>
        <input
          id="store-id"
          type="text"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="your-store@email.com"
          disabled={isLoading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Enter your password"
          disabled={isLoading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
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
        disabled={isLoading || !storeId.trim() || !password.trim()}
        className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Logging in...</span>
          </>
        ) : (
          <>
            <Store className="w-5 h-5" />
            <span>Log In</span>
          </>
        )}
      </button>
    </div>
  );
}

export default LoginForm;
