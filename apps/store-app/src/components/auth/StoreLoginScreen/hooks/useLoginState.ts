/**
 * useLoginState Hook
 *
 * Custom hook that manages all login state and handlers for StoreLoginScreen.
 * Extracts complex state logic from the main component.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { storeAuthManager, type MemberSession } from '../../../../services/storeAuthManager';
import { memberAuthService } from '../../../../services/memberAuthService';
import { authService } from '../../../../services/supabase';
import {
  setStoreSession,
  setMemberSession,
  clearAllAuth,
  setAuthStatus,
  setAvailableStores,
} from '../../../../store/slices/authSlice';
import { setStoreTimezone } from '../../../../utils/dateUtils';
import { hasSkippedPinSetup } from '../../PinSetupModal';
import { auditLogger } from '../../../../services/audit/auditLogger';
import { AUTH_TIMEOUTS } from '../../constants';
import type { MemberAuthSession } from '../../../../types/memberAuth';
import type { LoginMode, PinSetupMemberInfo } from '../types';

interface UseLoginStateProps {
  onLoggedIn: () => void;
}

export function useLoginState({ onLoggedIn }: UseLoginStateProps) {
  const dispatch = useDispatch();

  // Login mode toggle
  const [loginMode, setLoginMode] = useState<LoginMode>('member');

  // Store login state
  const [storeId, setStoreId] = useState('');
  const [password, setPassword] = useState('');

  // Member login state
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [showMemberPassword, setShowMemberPassword] = useState(false);

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
  const [pinSetupMember, setPinSetupMember] = useState<PinSetupMemberInfo | null>(null);

  // Forgot password modal state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

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

  // Load members when needed
  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const storeMembers = await storeAuthManager.getStoreMembers();
      setMembers(storeMembers);
    } catch (err) {
      auditLogger.log({
        action: 'read',
        entityType: 'member',
        description: 'Failed to load store members for PIN login',
        severity: 'medium',
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error loading members',
        metadata: { operation: 'loadMembers', loginMode: 'pin' },
      });
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  // Handle store login
  const handleLogin = useCallback(async () => {
    if (!storeId.trim()) {
      setError('Please enter your Store ID');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    isLoginAttemptRef.current = true;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await storeAuthManager.loginStore(storeId.trim(), password);

      if (result.status === 'active') {
        setSuccess('Login successful!');
        if (result.store) {
          dispatch(
            setStoreSession({
              storeId: result.store.storeId,
              storeName: result.store.storeName,
              storeLoginId: result.store.storeLoginId,
              tenantId: result.store.tenantId,
              tier: result.store.tier,
            })
          );
        }
        dispatch(setAuthStatus('active'));
        onLoggedIn();
      } else if (result.status === 'store_logged_in') {
        setSuccess('Login successful!');
        if (result.store) {
          dispatch(
            setStoreSession({
              storeId: result.store.storeId,
              storeName: result.store.storeName,
              storeLoginId: result.store.storeLoginId,
              tenantId: result.store.tenantId,
              tier: result.store.tier,
            })
          );
        }
        dispatch(setAuthStatus('active'));
        onLoggedIn();
      } else if (result.status === 'offline_grace') {
        setSuccess('Logged in (offline mode).');
        dispatch(setAuthStatus('offline_grace'));
        onLoggedIn();
      } else {
        const errorMessage = result.message || 'Login failed. Please check your credentials.';
        setError(errorMessage);
        isLoginAttemptRef.current = false;
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Unable to connect. Please check your connection and try again.';
      auditLogger.log({
        action: 'login',
        entityType: 'store',
        description: 'Store login exception',
        severity: 'medium',
        success: false,
        errorMessage,
        metadata: { operation: 'handleLogin', loginMode: 'store', storeId: storeId.trim() },
      });
      setError(errorMessage);
      isLoginAttemptRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [storeId, password, dispatch, onLoggedIn]);

  // Handle member email/password login (uses Supabase Auth)
  const handleMemberLogin = useCallback(async () => {
    if (!memberEmail.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!memberPassword.trim()) {
      setError('Please enter your password');
      return;
    }

    if (!isOnline) {
      setError(
        'Connect to the internet for first login. Once logged in, you can use PIN for offline access.'
      );
      return;
    }

    isLoginAttemptRef.current = true;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Authenticate with Supabase Auth
      const authSession: MemberAuthSession = await memberAuthService.loginWithPassword(
        memberEmail.trim(),
        memberPassword
      );

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

      for (const stId of storeIds) {
        const storeDetails = await authService.getStoreById(stId);
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
        ? allStores.find((s) => s.storeId === defaultStoreId) || allStores[0]
        : allStores[0];

      // 5. Set store timezone for date formatting
      if (primaryStore.timezone) {
        setStoreTimezone(primaryStore.timezone);
      }

      // 6. Persist the store session
      authService.setStoreSession({
        storeId: primaryStore.storeId,
        storeName: primaryStore.storeName,
        storeLoginId: primaryStore.storeLoginId,
        tenantId: primaryStore.tenantId,
        tier: primaryStore.tier,
        timezone: primaryStore.timezone,
      });

      // 7. Create member session for Redux
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
        avatarUrl: undefined,
        permissions: authSession.permissions,
      };

      setSuccess(`Welcome, ${firstName || memberSessionData.memberName}!`);

      // 8. Dispatch Redux actions
      dispatch(
        setStoreSession({
          storeId: primaryStore.storeId,
          storeName: primaryStore.storeName,
          storeLoginId: primaryStore.storeLoginId,
          tenantId: primaryStore.tenantId,
          tier: primaryStore.tier,
        })
      );

      dispatch(setMemberSession(memberSessionData));

      if (allStores.length > 0) {
        dispatch(setAvailableStores(allStores));
      }

      dispatch(setAuthStatus('active'));

      // 9. Start grace period checker for offline access
      memberAuthService.startGraceChecker();

      // 10. Check if user has PIN set up
      const hasPin = await memberAuthService.hasPin(authSession.memberId);
      const hasSkipped = hasSkippedPinSetup(authSession.memberId);

      if (!hasPin && !hasSkipped) {
        setPinSetupMember({ memberId: authSession.memberId, name: firstName || authSession.name });
        setShowPinSetupModal(true);
      } else {
        onLoggedIn();
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Unable to connect. Please check your connection and try again.';
      auditLogger.log({
        action: 'login',
        entityType: 'member',
        description: 'Member email/password login exception',
        severity: 'medium',
        success: false,
        errorMessage,
        metadata: {
          operation: 'handleMemberLogin',
          loginMode: 'member',
          email: memberEmail.trim().replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for privacy
        },
      });
      setError(errorMessage);
      isLoginAttemptRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [memberEmail, memberPassword, isOnline, dispatch, onLoggedIn]);

  // Handle PIN setup completion
  const handlePinSetupComplete = useCallback(() => {
    setShowPinSetupModal(false);
    setPinSetupMember(null);
    onLoggedIn();
  }, [onLoggedIn]);

  // Handle PIN setup skip
  const handlePinSetupSkip = useCallback(() => {
    setShowPinSetupModal(false);
    setPinSetupMember(null);
    onLoggedIn();
  }, [onLoggedIn]);

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
    setShowForgotPasswordModal(true);
  }, []);

  // Handle PIN login
  const handlePinLogin = useCallback(async () => {
    if (pin.length < 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const member = await storeAuthManager.loginWithPin(pin);

      if (member) {
        setSuccess(`Welcome, ${member.firstName || member.memberName}!`);
        dispatch(
          setMemberSession({
            memberId: member.memberId,
            memberName: member.memberName,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            role: member.role,
            avatarUrl: member.avatarUrl,
            permissions: member.permissions,
          })
        );
        onLoggedIn();
      } else {
        setError('Invalid PIN. Please try again.');
        setPin('');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'PIN verification failed.';
      auditLogger.log({
        action: 'login',
        entityType: 'member',
        description: 'PIN login exception',
        severity: 'medium',
        success: false,
        errorMessage: errMsg,
        metadata: { operation: 'handlePinLogin', loginMode: 'pin' },
      });
      setError(errMsg);
      setPin('');
    } finally {
      setIsLoading(false);
    }
  }, [pin, dispatch, onLoggedIn]);

  // Handle PIN input (auto-submit on 4+ digits)
  const handlePinChange = useCallback(
    (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 6);
      setPin(digits);
      setError(null);

      if (digits.length >= 4 && !isLoading) {
        setTimeout(() => handlePinLogin(), AUTH_TIMEOUTS.PIN_AUTO_SUBMIT_DELAY_MS);
      }
    },
    [isLoading, handlePinLogin]
  );

  // Handle PIN keypad press
  const handlePinKeyPress = useCallback(
    (digit: string) => {
      if (pin.length < 6) {
        handlePinChange(pin + digit);
      }
    },
    [pin, handlePinChange]
  );

  // Handle backspace on PIN
  const handlePinBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  }, []);

  // Handle logout from store
  const handleLogoutStore = useCallback(async () => {
    await storeAuthManager.logoutStore();
    dispatch(clearAllAuth());
    setPin('');
    setMembers([]);
    setError(null);
    setSuccess(null);
  }, [dispatch]);

  // Handle Enter key for store login
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading) {
        e.preventDefault();
        handleLogin();
      }
    },
    [isLoading, handleLogin]
  );

  // Handle Enter key for member login
  const handleMemberKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading) {
        e.preventDefault();
        handleMemberLogin();
      }
    },
    [isLoading, handleMemberLogin]
  );

  // Clear error when switching login modes
  const handleLoginModeChange = useCallback((mode: LoginMode) => {
    setLoginMode(mode);
    setError(null);
    setSuccess(null);
  }, []);

  // Toggle password visibility for member login
  const handleShowMemberPasswordToggle = useCallback(() => {
    setShowMemberPassword(prev => !prev);
  }, []);

  // Handle PIN keyboard events
  const handlePinKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Backspace') {
        handlePinBackspace();
      } else if (e.key === 'Enter' && pin.length >= 4 && !isLoading) {
        e.preventDefault();
        handlePinLogin();
      }
    },
    [pin, isLoading, handlePinBackspace, handlePinLogin]
  );

  return {
    // State
    loginMode,
    storeId,
    setStoreId,
    password,
    setPassword,
    memberEmail,
    setMemberEmail,
    memberPassword,
    setMemberPassword,
    showMemberPassword,
    pin,
    members,
    loadingMembers,
    isLoading,
    error,
    success,
    isOnline,
    showPinSetupModal,
    pinSetupMember,
    showForgotPasswordModal,
    setShowForgotPasswordModal,
    isLoginAttemptRef,

    // Actions
    loadMembers,
    handleLogin,
    handleMemberLogin,
    handlePinSetupComplete,
    handlePinSetupSkip,
    handleForgotPassword,
    handlePinLogin,
    handlePinChange,
    handlePinKeyPress,
    handlePinBackspace,
    handleLogoutStore,
    handleKeyDown,
    handleMemberKeyDown,
    handleLoginModeChange,
    handleShowMemberPasswordToggle,
    handlePinKeyDown,
  };
}

export default useLoginState;
