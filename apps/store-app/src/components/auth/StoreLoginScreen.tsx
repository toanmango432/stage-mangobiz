/**
 * Store Login Screen
 * Supports two authentication modes:
 * 1. Store Login: Store credentials (email + password) - for shared POS devices
 * 2. Member Login: Member credentials (email + password) via Supabase Auth - for individual staff login
 *
 * Member Login now uses Supabase Auth for enhanced security with optional PIN setup.
 */

import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Store, Loader2, AlertCircle, CheckCircle2, WifiOff, XCircle, User, KeyRound, ArrowLeft } from 'lucide-react';
import { storeAuthManager, type StoreAuthState, type MemberSession } from '../../services/storeAuthManager';
import { memberAuthService } from '../../services/memberAuthService';
import { authService } from '../../services/supabase';
import { setStoreSession, setMemberSession, clearAllAuth, setAuthStatus, setAvailableStores } from '../../store/slices/authSlice';
import { setStoreTimezone } from '../../utils/dateUtils';
import { PinSetupModal, hasSkippedPinSetup } from './PinSetupModal';
import type { MemberAuthSession } from '../../types/memberAuth';

type LoginMode = 'store' | 'member';

interface StoreLoginScreenProps {
  onLoggedIn: () => void;
  initialState?: StoreAuthState;
}

export function StoreLoginScreen({ onLoggedIn, initialState }: StoreLoginScreenProps) {
  const dispatch = useDispatch();

  // Login mode toggle
  const [loginMode, setLoginMode] = useState<LoginMode>('member');

  // Store login state
  const [storeId, setStoreId] = useState('');
  const [password, setPassword] = useState('');

  // Member login state
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');

  // PIN login state
  const [pin, setPin] = useState('');
  const [members, setMembers] = useState<MemberSession[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // General state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // PIN setup modal state (for member login mode)
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [pinSetupMember, setPinSetupMember] = useState<{ memberId: string; name: string } | null>(null);

  // Track if we're in a login attempt to prevent error from being cleared
  const isLoginAttemptRef = useRef(false);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  // Handle member email/password login (uses Supabase Auth via memberAuthService)
  const handleMemberLogin = async () => {
    if (!memberEmail.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!memberPassword.trim()) {
      setError('Please enter your password');
      return;
    }

    // Check offline status for member login
    if (!isOnline) {
      setError('Connect to the internet for first login. Once logged in, you can use PIN for offline access.');
      return;
    }

    console.log('🔐 Starting member login (Supabase Auth) for:', memberEmail.trim());
    isLoginAttemptRef.current = true;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Authenticate with Supabase Auth via memberAuthService
      const authSession: MemberAuthSession = await memberAuthService.loginWithPassword(
        memberEmail.trim(),
        memberPassword
      );
      console.log('✅ Supabase Auth successful for member:', authSession.memberId);

      // 2. Get the member's store access list
      const storeIds = authSession.storeIds || [];
      if (storeIds.length === 0) {
        throw new Error('No store access assigned to this account');
      }

      // 3. Fetch all store details for switching
      const allStores: Array<{
        storeId: string;
        storeName: string;
        storeLoginId: string;
        tenantId: string;
        tier: string;
        timezone?: string;
      }> = [];

      for (const storeId of storeIds) {
        const storeDetails = await authService.getStoreById(storeId);
        if (storeDetails) {
          allStores.push({
            storeId: storeDetails.storeId,
            storeName: storeDetails.storeName,
            storeLoginId: storeDetails.storeLoginId,
            tenantId: storeDetails.tenantId,
            tier: storeDetails.tier,
            timezone: storeDetails.timezone || undefined,
          });
        }
      }

      if (allStores.length === 0) {
        throw new Error('Could not load store details');
      }

      // 4. Use default store or first store as the primary
      const defaultStoreId = authSession.defaultStoreId;
      const primaryStore = defaultStoreId
        ? allStores.find(s => s.storeId === defaultStoreId) || allStores[0]
        : allStores[0];

      // 5. Set store timezone for date formatting
      if (primaryStore.timezone) {
        setStoreTimezone(primaryStore.timezone);
      }

      // 6. Persist the store session for session restoration
      authService.setStoreSession({
        storeId: primaryStore.storeId,
        storeName: primaryStore.storeName,
        storeLoginId: primaryStore.storeLoginId,
        tenantId: primaryStore.tenantId,
        tier: primaryStore.tier,
        timezone: primaryStore.timezone,
      });

      // 7. Create member session for Redux (map MemberAuthSession to MemberSession)
      const nameParts = authSession.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const memberSessionData: MemberSession = {
        memberId: authSession.memberId,
        memberName: authSession.name,
        firstName,
        lastName,
        email: authSession.email,
        role: authSession.role as MemberSession['role'],
        avatarUrl: undefined, // MemberAuthSession doesn't have avatarUrl
        permissions: authSession.permissions,
      };

      console.log('✅ Member login successful for:', memberSessionData.memberName);
      setSuccess(`Welcome, ${firstName || memberSessionData.memberName}!`);

      // 8. Dispatch Redux actions
      dispatch(setStoreSession({
        storeId: primaryStore.storeId,
        storeName: primaryStore.storeName,
        storeLoginId: primaryStore.storeLoginId,
        tenantId: primaryStore.tenantId,
        tier: primaryStore.tier,
      }));

      dispatch(setMemberSession(memberSessionData));

      if (allStores.length > 0) {
        dispatch(setAvailableStores(allStores));
      }

      dispatch(setAuthStatus('active'));

      // 9. Start grace period checker for offline access
      memberAuthService.startGraceChecker();

      // 10. Check if user has PIN set up - show modal if not (optional)
      const hasPin = await memberAuthService.hasPin(authSession.memberId);
      const hasSkipped = hasSkippedPinSetup(authSession.memberId);

      if (!hasPin && !hasSkipped) {
        // Show PIN setup modal (user can skip)
        setPinSetupMember({ memberId: authSession.memberId, name: firstName || authSession.name });
        setShowPinSetupModal(true);
        // Don't call onLoggedIn yet - wait for modal to close
      } else {
        // PIN already set up or user has skipped - proceed directly
        onLoggedIn();
      }
    } catch (err: unknown) {
      console.error('❌ Member login exception:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unable to connect. Please check your connection and try again.';
      setError(errorMessage);
      isLoginAttemptRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PIN setup completion
  const handlePinSetupComplete = () => {
    setShowPinSetupModal(false);
    setPinSetupMember(null);
    onLoggedIn();
  };

  // Handle PIN setup skip
  const handlePinSetupSkip = () => {
    setShowPinSetupModal(false);
    setPinSetupMember(null);
    onLoggedIn();
  };

  // Handle forgot password (opens Supabase reset flow)
  const handleForgotPassword = async () => {
    if (!memberEmail.trim()) {
      setError('Please enter your email address first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await import('../../services/supabase/client').then(m =>
        m.supabase.auth.resetPasswordForEmail(memberEmail.trim(), {
          // Redirect URL after password reset - adjust to your app URL
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })
      );

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess('Check your email for a password reset link');
      }
    } catch (err) {
      console.error('Failed to send reset email:', err);
      setError('Failed to send reset email. Please try again.');
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

  const handleMemberKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleMemberLogin();
    }
  };

  // Clear error when switching login modes
  const handleLoginModeChange = (mode: LoginMode) => {
    setLoginMode(mode);
    setError(null);
    setSuccess(null);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-amber-50 to-yellow-50 p-4">
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
            <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-amber-500 rounded-2xl flex items-center justify-center">
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
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
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
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
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
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
            loginMode === 'member'
              ? 'bg-gradient-to-br from-brand-500 to-amber-500'
              : 'bg-gradient-to-br from-orange-500 to-pink-500'
          }`}>
            {loginMode === 'member' ? (
              <User className="w-10 h-10 text-white" />
            ) : (
              <Store className="w-10 h-10 text-white" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Mango POS</h1>
          <p className="text-gray-600">
            {loginMode === 'member'
              ? 'Sign in with your credentials'
              : 'Log in to your store'}
          </p>
        </div>

        {/* Login Mode Toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => handleLoginModeChange('member')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              loginMode === 'member'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4" />
            Staff Login
          </button>
          <button
            onClick={() => handleLoginModeChange('store')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              loginMode === 'store'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Store className="w-4 h-4" />
            Store Login
          </button>
        </div>

        {/* Form based on mode */}
        {loginMode === 'member' ? (
          <MemberLoginForm
            email={memberEmail}
            setEmail={setMemberEmail}
            password={memberPassword}
            setPassword={setMemberPassword}
            isLoading={isLoading}
            error={error}
            success={success}
            onLogin={handleMemberLogin}
            onKeyDown={handleMemberKeyDown}
            isOnline={isOnline}
            onForgotPassword={handleForgotPassword}
          />
        ) : (
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
        )}

        {/* Demo credentials */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-sm text-emerald-800 font-medium mb-2">
            {loginMode === 'member' ? 'Demo Staff' : 'Demo Stores'}
          </p>
          {loginMode === 'member' ? (
            <div className="space-y-1 text-xs text-emerald-600">
              <p>Owner: <span className="font-mono">owner@demosalon.com</span> / <span className="font-mono">owner123</span></p>
              <p>Manager: <span className="font-mono">mike@demosalon.com</span> / <span className="font-mono">mike123</span></p>
            </div>
          ) : (
            <div className="space-y-1 text-xs text-emerald-600">
              <p>Store 1: <span className="font-mono">demo@salon.com</span> / <span className="font-mono">demo123</span></p>
              <p>Store 2: <span className="font-mono">mango001</span> / <span className="font-mono">password123</span></p>
            </div>
          )}
        </div>
      </div>

      {/* PIN Setup Modal - shown after successful member login if PIN not set up */}
      <PinSetupModal
        isOpen={showPinSetupModal}
        onClose={handlePinSetupComplete}
        onSubmit={handlePinSetupComplete}
        onSkip={handlePinSetupSkip}
        memberId={pinSetupMember?.memberId || ''}
        memberName={pinSetupMember?.name || ''}
        isRequired={false}
      />
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

// Member login form component
interface MemberLoginFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  onLogin: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isOnline: boolean;
  onForgotPassword?: () => void;
}

function MemberLoginForm({
  email,
  setEmail,
  password,
  setPassword,
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
        <input
          id="member-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Enter your password"
          disabled={isLoading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
