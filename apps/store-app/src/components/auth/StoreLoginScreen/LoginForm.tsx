/**
 * LoginForm Component
 *
 * Store login form with Store ID/Email and password fields.
 * Used for shared POS device authentication.
 */

import { useState } from 'react';
import { Store, Loader2, AlertCircle, CheckCircle2, Building2, Lock, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${compact ? 'space-y-3' : ''}`}>
      <div>
        <label htmlFor="store-id" className="block text-sm font-medium text-gray-700 mb-2">
          Store ID or Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="store-id"
            type="text"
            name="username"
            autoComplete="username"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="mango001 or store@email.com"
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            autoFocus
          />
        </div>
      </div>

      <div>
        <label htmlFor="store-password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="store-password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Enter your password"
            disabled={isLoading}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
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
    </form>
  );
}

export default LoginForm;
