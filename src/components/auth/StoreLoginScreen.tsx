/**
 * Store Login Screen
 * Two-tier authentication: Store login + Member PIN
 * 1. First: Enter store credentials (email + password)
 * 2. Then: Enter member PIN to identify who's using the POS
 */

import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Store, Loader2, AlertCircle, CheckCircle2, WifiOff, XCircle, User, KeyRound, ArrowLeft } from 'lucide-react';
import { storeAuthManager, type StoreAuthState, type MemberSession } from '../../services/storeAuthManager';
import { setStoreSession, setMemberSession, clearAllAuth, setAuthStatus } from '../../store/slices/authSlice';

interface StoreLoginScreenProps {
  onLoggedIn: () => void;
  initialState?: StoreAuthState;
}

export function StoreLoginScreen({ onLoggedIn, initialState }: StoreLoginScreenProps) {
  const dispatch = useDispatch();

  // Store login state
  const [storeId, setStoreId] = useState('');
  const [password, setPassword] = useState('');

  // PIN login state
  const [pin, setPin] = useState('');
  const [members, setMembers] = useState<MemberSession[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // General state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Track if we're in a login attempt to prevent error from being cleared
  const isLoginAttemptRef = useRef(false);

  const state = initialState || storeAuthManager.getState();

  // Load members when store is logged in
  useEffect(() => {
    if (state.status === 'store_logged_in' && state.store?.storeId) {
      loadMembers();
    }
  }, [state.status, state.store?.storeId]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const storeMembers = await storeAuthManager.getStoreMembers();
      setMembers(storeMembers);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Sync error from initialState when login fails
  useEffect(() => {
    if (initialState?.status === 'not_logged_in' && initialState?.message && !isLoginAttemptRef.current) {
      if (!isLoading && initialState.message !== 'Please log in to your store.' && initialState.message !== 'Logged out.') {
        console.log('📋 Syncing error from initialState:', initialState.message);
        setError(initialState.message);
      }
    }
  }, [initialState?.status, initialState?.message, isLoading]);

  // Handle store login
  const handleLogin = async () => {
    if (!storeId.trim()) {
      setError('Please enter your Store ID');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    console.log('🔐 Starting store login for:', storeId.trim());
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
        // Dispatch Redux action for full session (backward compatibility)
        if (result.store) {
          dispatch(setStoreSession({
            storeId: result.store.storeId,
            storeName: result.store.storeName,
            storeLoginId: result.store.storeLoginId,
            tenantId: result.store.tenantId,
            tier: result.store.tier,
          }));
        }
        dispatch(setAuthStatus('active'));
        onLoggedIn();
      } else if (result.status === 'store_logged_in') {
        // Note: This branch is rarely reached now since store login defaults to 'active'
        // Kept for backward compatibility if skipMemberLogin: false is explicitly set
        console.log('✅ Store logged in - proceeding to app');
        setSuccess('Login successful!');
        // Dispatch Redux action for store session
        if (result.store) {
          dispatch(setStoreSession({
            storeId: result.store.storeId,
            storeName: result.store.storeName,
            storeLoginId: result.store.storeLoginId,
            tenantId: result.store.tenantId,
            tier: result.store.tier,
          }));
        }
        dispatch(setAuthStatus('active'));
        onLoggedIn();
      } else if (result.status === 'offline_grace') {
        console.log('✅ Login successful - status: offline_grace');
        setSuccess('Logged in (offline mode).');
        dispatch(setAuthStatus('offline_grace'));
        onLoggedIn();
      } else {
        const errorMessage = result.message || 'Login failed. Please check your credentials.';
        console.log('❌ Login failed - status:', result.status, 'message:', errorMessage);
        setError(errorMessage);
        isLoginAttemptRef.current = false;
      }
    } catch (err: any) {
      console.error('❌ Login exception:', err);
      const errorMessage = err?.message || 'Unable to connect. Please check your connection and try again.';
      setError(errorMessage);
      isLoginAttemptRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PIN login
  const handlePinLogin = async () => {
    if (pin.length < 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    console.log('🔢 PIN login attempt');
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const member = await storeAuthManager.loginWithPin(pin);

      if (member) {
        console.log('✅ PIN login successful for:', member.memberName);
        setSuccess(`Welcome, ${member.firstName || member.memberName}!`);
        // Dispatch Redux action for member session
        dispatch(setMemberSession({
          memberId: member.memberId,
          memberName: member.memberName,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          role: member.role,
          avatarUrl: member.avatarUrl,
          permissions: member.permissions,
        }));
        onLoggedIn();
      } else {
        setError('Invalid PIN. Please try again.');
        setPin('');
      }
    } catch (err: any) {
      console.error('❌ PIN login exception:', err);
      setError(err?.message || 'PIN verification failed.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PIN input (auto-submit on 4+ digits)
  const handlePinChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setPin(digits);
    setError(null);

    // Auto-submit when 4 digits entered
    if (digits.length >= 4 && !isLoading) {
      setTimeout(() => handlePinLogin(), 100);
    }
  };

  // Handle PIN keypad press
  const handlePinKeyPress = (digit: string) => {
    if (pin.length < 6) {
      handlePinChange(pin + digit);
    }
  };

  // Handle backspace on PIN
  const handlePinBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(null);
  };

  // Handle logout from store
  const handleLogoutStore = async () => {
    await storeAuthManager.logoutStore();
    dispatch(clearAllAuth());
    setPin('');
    setMembers([]);
    setError(null);
    setSuccess(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleLogin();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      handlePinBackspace();
    } else if (e.key === 'Enter' && pin.length >= 4 && !isLoading) {
      e.preventDefault();
      handlePinLogin();
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

  // PIN Screen (store logged in, awaiting member PIN)
  if (state.status === 'store_logged_in') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Back button */}
          <button
            onClick={handleLogoutStore}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Different store</span>
          </button>

          {/* Store info */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center">
              <KeyRound className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">{state.store?.storeName || 'Your Store'}</h1>
            <p className="text-gray-600">
              Enter your PIN to continue
            </p>
          </div>

          {/* Member avatars (if available) */}
          {members.length > 0 && (
            <div className="flex justify-center gap-2 flex-wrap">
              {members.slice(0, 6).map((member) => (
                <div
                  key={member.memberId}
                  className="flex flex-col items-center gap-1"
                  title={member.memberName}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.memberName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      member.firstName?.charAt(0) || member.memberName?.charAt(0) || <User className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 truncate max-w-[60px]">
                    {member.firstName || member.memberName?.split(' ')[0]}
                  </span>
                </div>
              ))}
              {members.length > 6 && (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                    +{members.length - 6}
                  </div>
                </div>
              )}
            </div>
          )}

          {loadingMembers && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {/* PIN Display */}
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-12 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                  pin.length > i
                    ? 'border-teal-500 bg-teal-50 text-teal-600'
                    : 'border-gray-200 bg-gray-50 text-gray-300'
                }`}
              >
                {pin.length > i ? '●' : ''}
              </div>
            ))}
          </div>

          {/* Hidden input for keyboard */}
          <input
            type="password"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            onKeyDown={handlePinKeyDown}
            className="sr-only"
            autoFocus
            maxLength={6}
          />

          {/* PIN Keypad */}
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'backspace'].map((key, index) => (
              <button
                key={index}
                onClick={() => {
                  if (key === 'backspace') handlePinBackspace();
                  else if (key !== null) handlePinKeyPress(String(key));
                }}
                disabled={isLoading || (key !== 'backspace' && key !== null && pin.length >= 6)}
                className={`h-14 rounded-xl font-semibold text-xl transition-all ${
                  key === null
                    ? 'invisible'
                    : key === 'backspace'
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:scale-95'
                } disabled:opacity-50`}
              >
                {key === 'backspace' ? '⌫' : key}
              </button>
            ))}
          </div>

          {/* Error/Success messages */}
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

          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            </div>
          )}
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-sm text-emerald-800 font-medium mb-2">Demo Mode</p>
          <p className="text-xs text-emerald-600">
            Demo: <span className="font-mono">demo@salon.com</span> / <span className="font-mono">demo123</span>
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
