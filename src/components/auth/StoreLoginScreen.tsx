/**
 * Store Login Screen
 * Replaces the license key activation with store credentials login
 */

import { useState, useEffect, useRef } from 'react';
import { Store, Loader2, AlertCircle, CheckCircle2, WifiOff, XCircle } from 'lucide-react';
import { storeAuthManager, type StoreAuthState } from '../../services/storeAuthManager';

interface StoreLoginScreenProps {
  onLoggedIn: () => void;
  initialState?: StoreAuthState;
}

export function StoreLoginScreen({ onLoggedIn, initialState }: StoreLoginScreenProps) {
  const [storeId, setStoreId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Track if we're in a login attempt to prevent error from being cleared
  const isLoginAttemptRef = useRef(false);

  const state = initialState || storeAuthManager.getState();

  // Sync error from initialState when login fails
  // This ensures error persists even if component re-renders due to auth state change
  useEffect(() => {
    if (initialState?.status === 'not_logged_in' && initialState?.message && !isLoginAttemptRef.current) {
      // Don't override during active login attempt
      if (!isLoading && initialState.message !== 'Please log in to your store.' && initialState.message !== 'Logged out.') {
        console.log('📋 Syncing error from initialState:', initialState.message);
        setError(initialState.message);
      }
    }
  }, [initialState?.status, initialState?.message, isLoading]);

  const handleLogin = async () => {
    if (!storeId.trim()) {
      setError('Please enter your Store ID');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    console.log('🔐 Starting login attempt for:', storeId.trim());
    isLoginAttemptRef.current = true;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await storeAuthManager.loginStore(storeId.trim(), password);
      console.log('🔐 Login result:', JSON.stringify(result, null, 2));

      if (result.status === 'active') {
        console.log('✅ Login successful - status: active');
        setSuccess('Login successful!');
        // Call immediately - no need for artificial delay
        onLoggedIn();
      } else if (result.status === 'offline_grace') {
        console.log('✅ Login successful - status: offline_grace');
        setSuccess('Logged in (offline mode).');
        // Call immediately - no need for artificial delay
        onLoggedIn();
      } else {
        // Handle all error statuses (not_logged_in, suspended, inactive, etc.)
        const errorMessage = result.message || 'Login failed. Please check your credentials.';
        console.log('❌ Login failed - status:', result.status, 'message:', errorMessage);
        setError(errorMessage);
        isLoginAttemptRef.current = false;
      }
    } catch (err: any) {
      console.error('❌ Login exception:', err);
      // Handle network errors and other exceptions
      const errorMessage = err?.message || 'Unable to connect. Please check your connection and try again.';
      setError(errorMessage);
      isLoginAttemptRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleLogin();
    }
  };

  // Offline expired screen
  if (state.status === 'offline_expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
              <WifiOff className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Session Expired</h1>
            <p className="text-gray-600">
              Your offline session has expired. Please log in again.
            </p>
          </div>

          <LoginForm
            storeId={storeId}
            setStoreId={setStoreId}
            password={password}
            setPassword={setPassword}
            isLoading={isLoading}
            error={error}
            success={success}
            onLogin={handleLogin}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    );
  }

  // Suspended screen
  if (state.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <XCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Store Suspended</h1>
            <p className="text-gray-600">
              This store has been suspended. Please contact support.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 text-center">
              {state.message || 'Please contact your administrator for assistance.'}
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-4">
              Have a different store account?
            </p>
            <LoginForm
              storeId={storeId}
              setStoreId={setStoreId}
              password={password}
              setPassword={setPassword}
              isLoading={isLoading}
              error={error}
              success={success}
              onLogin={handleLogin}
              onKeyDown={handleKeyDown}
              compact
            />
          </div>
        </div>
      </div>
    );
  }

  // Default login screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <Store className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Mango POS</h1>
          <p className="text-gray-600">
            Log in to your store to get started
          </p>
        </div>

        {/* Form */}
        <LoginForm
          storeId={storeId}
          setStoreId={setStoreId}
          password={password}
          setPassword={setPassword}
          isLoading={isLoading}
          error={error}
          success={success}
          onLogin={handleLogin}
          onKeyDown={handleKeyDown}
        />

        {/* Demo credentials */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p>
          <p className="text-sm text-blue-700">
            <span className="font-mono">demo@salon.com</span> / <span className="font-mono">demo123</span>
          </p>
        </div>

        {/* Help text */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Don't have store credentials?{' '}
            <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
              Contact your provider
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Extracted login form component
interface LoginFormProps {
  storeId: string;
  setStoreId: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  onLogin: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  compact?: boolean;
}

function LoginForm({
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
