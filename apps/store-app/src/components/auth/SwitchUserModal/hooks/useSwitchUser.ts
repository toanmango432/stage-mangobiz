/**
 * useSwitchUser Hook
 *
 * Custom hook that manages all state and handlers for the SwitchUserModal.
 * Extracts complex state logic from the main component.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectStoreId, selectMember, setMemberSession, clearMemberSession } from '../../../../store/slices/authSlice';
import { authService, type MemberSession } from '../../../../services/supabase/authService';
import { memberAuthService } from '../../../../services/memberAuthService';
import { auditLogger } from '../../../../services/audit/auditLogger';
import { AUTH_TIMEOUTS } from '../../constants';
import type { LoginContext } from '@/types/memberAuth';
import type { MemberRole } from '../../../../services/supabase/types';
import type { Step, DisplayMember } from '../types';
import type { MemberAuthSession } from '@/types/memberAuth';

/**
 * Helper to handle successful authentication (password or PIN).
 * Parses name, dispatches Redux action, shows success state, and triggers callbacks.
 */
interface AuthSuccessParams {
  authSession: MemberAuthSession;
  dispatch: ReturnType<typeof useAppDispatch>;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  onSuccess?: (member: MemberSession) => void;
  onClose: () => void;
  startGraceChecker?: boolean;
}

function handleAuthSuccess({
  authSession,
  dispatch,
  setStep,
  onSuccess,
  onClose,
  startGraceChecker = false,
}: AuthSuccessParams): void {
  const nameParts = authSession.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  dispatch(setMemberSession({
    memberId: authSession.memberId,
    memberName: authSession.name,
    firstName,
    lastName,
    email: authSession.email,
    role: authSession.role as 'owner' | 'manager' | 'staff' | 'receptionist' | 'junior',
    avatarUrl: undefined,
    permissions: authSession.permissions || undefined,
  }));

  if (startGraceChecker) {
    memberAuthService.startGraceChecker();
  }

  setStep('success');
  setTimeout(() => {
    const memberSession: MemberSession = {
      memberId: authSession.memberId,
      email: authSession.email,
      firstName,
      lastName,
      role: authSession.role as MemberRole,
      storeIds: authSession.storeIds,
      avatarUrl: null,
      permissions: authSession.permissions,
    };
    onSuccess?.(memberSession);
    onClose();
  }, AUTH_TIMEOUTS.SUCCESS_DISPLAY_MS);
}

interface UseSwitchUserProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (member: MemberSession) => void;
  loginContext: LoginContext;
  isOnline: boolean;
}

export function useSwitchUser({
  isOpen,
  onClose,
  onSuccess,
  loginContext,
  isOnline,
}: UseSwitchUserProps) {
  const dispatch = useAppDispatch();
  const storeId = useAppSelector(selectStoreId);
  const currentMember = useAppSelector(selectMember);

  const [step, setStep] = useState<Step>('select');
  const [members, setMembers] = useState<DisplayMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<DisplayMember | null>(null);

  // Password login state (member-login + online)
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // PIN login state (store-login OR member-login + offline)
  const [pin, setPin] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingMembers, setFetchingMembers] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  /**
   * AbortController ref for cancelling fetchMembers requests.
   * Prevents memory leaks when:
   * - Component unmounts during fetch
   * - Modal closes during fetch
   * - A new fetch starts before previous completes
   */
  const fetchAbortControllerRef = useRef<AbortController | null>(null);

  // Fetch members when modal opens
  useEffect(() => {
    if (isOpen && storeId) {
      fetchMembers();
    }

    // Cleanup: cancel any in-flight fetch when modal closes or component unmounts
    return () => {
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
        fetchAbortControllerRef.current = null;
      }
    };
  }, [isOpen, storeId]);

  // Focus password input when step changes to 'password'
  useEffect(() => {
    if (step === 'password' && passwordInputRef.current) {
      setTimeout(() => passwordInputRef.current?.focus(), AUTH_TIMEOUTS.INPUT_FOCUS_DELAY_MS);
    }
  }, [step]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setSelectedMember(null);
      setPassword('');
      setShowPassword(false);
      setPin('');
      setError(null);
    }
  }, [isOpen]);

  const fetchMembers = async () => {
    if (!storeId) return;

    // Cancel any previous in-flight fetch
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
    }

    // Create new abort controller for this fetch
    const abortController = new AbortController();
    fetchAbortControllerRef.current = abortController;

    setFetchingMembers(true);
    try {
      const storeMembers = await authService.getStoreMembers(storeId);

      // Check if this fetch was aborted before processing results
      if (abortController.signal.aborted) {
        return;
      }

      // Pre-cache members for PIN login capability
      // This enables PIN login for members who haven't logged in with password on this device
      for (const member of storeMembers) {
        memberAuthService.preCacheMemberForPinLogin(member);
      }

      // Enrich members with PIN status and lockout info
      const enrichedMembers: DisplayMember[] = await Promise.all(
        storeMembers.map(async (member) => {
          const hasPinSetup = await memberAuthService.hasPin(member.memberId);
          const lockoutInfo = memberAuthService.checkPinLockout(member.memberId);

          // Get grace info from cached session (now guaranteed to exist after pre-caching)
          const cachedMembers = memberAuthService.getCachedMembers();
          const cachedMember = cachedMembers.find(m => m.memberId === member.memberId);
          const graceInfo = cachedMember
            ? memberAuthService.checkOfflineGrace(cachedMember)
            : undefined;

          return {
            ...member,
            hasPinSetup,
            lockoutInfo,
            graceInfo,
          };
        })
      );

      // Check again after async enrichment before setState
      if (abortController.signal.aborted) {
        return;
      }

      setMembers(enrichedMembers);
    } catch (err: unknown) {
      // Don't report errors for aborted fetches
      if (abortController.signal.aborted) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      auditLogger.log({
        action: 'login',
        entityType: 'member',
        description: 'Failed to fetch members for user switch',
        severity: 'medium',
        success: false,
        errorMessage,
        metadata: {
          storeId,
          operation: 'fetchMembers',
        },
      });
      setError('Failed to load staff members');
    } finally {
      // Only update loading state if this fetch wasn't aborted
      if (!abortController.signal.aborted) {
        setFetchingMembers(false);
      }
    }
  };

  /**
   * Determine the appropriate verification step based on context and online status.
   */
  const getVerificationStep = useCallback(
    (member: DisplayMember): Step | null => {
      if (loginContext === 'store') {
        return 'pin';
      }

      if (isOnline) {
        return 'password';
      }

      if (member.hasPinSetup) {
        return 'pin';
      }

      return null;
    },
    [loginContext, isOnline]
  );

  const handleMemberSelect = useCallback((member: DisplayMember) => {
    setSelectedMember(member);
    setError(null);
    setPin('');
    setPassword('');

    if (member.lockoutInfo?.isLocked) {
      setError(`PIN locked. Try again in ${member.lockoutInfo.remainingMinutes} minutes.`);
      return;
    }

    const nextStep = getVerificationStep(member);

    if (nextStep === null) {
      setError('Connect to internet to switch to this user (no PIN configured).');
      return;
    }

    setStep(nextStep);
  }, [getVerificationStep]);

  /**
   * Handle password submission (member-login + online)
   */
  const handlePasswordSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!storeId || !selectedMember || !password) return;

    setLoading(true);
    setError(null);

    try {
      const authSession = await memberAuthService.loginWithPassword(
        selectedMember.email,
        password
      );

      handleAuthSuccess({
        authSession,
        dispatch,
        setStep,
        onSuccess,
        onClose,
        startGraceChecker: true,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid password';
      auditLogger.log({
        action: 'login',
        entityType: 'member',
        entityId: selectedMember.memberId,
        description: 'Password verification failed during user switch',
        severity: 'medium',
        success: false,
        errorMessage,
        metadata: {
          storeId,
          operation: 'passwordSwitch',
          email: selectedMember.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
        },
      });
      setError(errorMessage);
      setPassword('');
    } finally {
      setLoading(false);
    }
  }, [storeId, selectedMember, password, dispatch, setStep, onSuccess, onClose]);

  /**
   * Handle PIN submission (store-login OR member-login + offline)
   */
  const handlePinSubmit = useCallback(async () => {
    if (!selectedMember || !pin) return;

    setLoading(true);
    setError(null);

    try {
      const authSession = await memberAuthService.loginWithPin(
        selectedMember.memberId,
        pin
      );

      handleAuthSuccess({
        authSession,
        dispatch,
        setStep,
        onSuccess,
        onClose,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid PIN';
      auditLogger.log({
        action: 'login',
        entityType: 'member',
        entityId: selectedMember.memberId,
        description: 'PIN verification failed during user switch',
        severity: 'medium',
        success: false,
        errorMessage,
        metadata: {
          operation: 'pinSwitch',
        },
      });
      setError(errorMessage);
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [selectedMember, pin, dispatch, setStep, onSuccess, onClose]);

  /**
   * Handle PIN input completion (auto-submit when complete)
   */
  const handlePinComplete = useCallback(
    async (completedPin: string) => {
      if (!selectedMember || loading) return;

      setPin(completedPin);
      setLoading(true);
      setError(null);

      try {
        const authSession = await memberAuthService.loginWithPin(
          selectedMember.memberId,
          completedPin
        );

        handleAuthSuccess({
          authSession,
          dispatch,
          setStep,
          onSuccess,
          onClose,
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Invalid PIN';
        auditLogger.log({
          action: 'login',
          entityType: 'member',
          entityId: selectedMember.memberId,
          description: 'PIN verification failed during user switch (auto-submit)',
          severity: 'medium',
          success: false,
          errorMessage,
          metadata: {
            operation: 'pinAutoSubmit',
          },
        });
        setError(errorMessage);
        setPin('');
      } finally {
        setLoading(false);
      }
    },
    [selectedMember, loading, dispatch, setStep, onSuccess, onClose]
  );

  const handleBack = useCallback(() => {
    setStep('select');
    setSelectedMember(null);
    setPassword('');
    setPin('');
    setShowPassword(false);
    setError(null);
  }, []);

  const handleLogoutCurrentMember = useCallback(() => {
    dispatch(clearMemberSession());
    setError(null);
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchMembers();
  }, []);

  const handlePinChange = useCallback((value: string) => {
    setPin(value);
    setError(null);
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    setError(null);
  }, []);

  const handleShowPasswordToggle = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return {
    // State
    step,
    members,
    selectedMember,
    currentMember,
    password,
    showPassword,
    pin,
    loading,
    error,
    fetchingMembers,
    passwordInputRef,

    // Actions
    handleMemberSelect,
    handlePasswordSubmit,
    handlePinSubmit,
    handlePinComplete,
    handleBack,
    handleLogoutCurrentMember,
    handleRetry,
    handlePinChange,
    handlePasswordChange,
    handleShowPasswordToggle,
  };
}

export default useSwitchUser;
