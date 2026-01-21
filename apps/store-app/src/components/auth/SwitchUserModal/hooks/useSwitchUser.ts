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
import type { LoginContext } from '@/types/memberAuth';
import type { MemberRole } from '../../../../services/supabase/types';
import type { Step, DisplayMember } from '../types';

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

  // Fetch members when modal opens
  useEffect(() => {
    if (isOpen && storeId) {
      fetchMembers();
    }
  }, [isOpen, storeId]);

  // Focus password input when step changes to 'password'
  useEffect(() => {
    if (step === 'password' && passwordInputRef.current) {
      setTimeout(() => passwordInputRef.current?.focus(), 100);
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

    setFetchingMembers(true);
    try {
      const storeMembers = await authService.getStoreMembers(storeId);

      // Enrich members with PIN status and lockout info
      const enrichedMembers: DisplayMember[] = await Promise.all(
        storeMembers.map(async (member) => {
          const hasPinSetup = await memberAuthService.hasPin(member.memberId);
          const lockoutInfo = memberAuthService.checkPinLockout(member.memberId);

          // Get grace info from cached session if available
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

      setMembers(enrichedMembers);
    } catch (err: unknown) {
      console.error('Failed to fetch members:', err);
      setError('Failed to load staff members');
    } finally {
      setFetchingMembers(false);
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

      memberAuthService.startGraceChecker();

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
      }, 1000);
    } catch (err: unknown) {
      console.error('Password verification failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Invalid password';
      setError(errorMessage);
      setPassword('');
    } finally {
      setLoading(false);
    }
  }, [storeId, selectedMember, password, dispatch, onSuccess, onClose]);

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
      }, 1000);
    } catch (err: unknown) {
      console.error('PIN verification failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Invalid PIN';
      setError(errorMessage);
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [selectedMember, pin, dispatch, onSuccess, onClose]);

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
        }, 1000);
      } catch (err: unknown) {
        console.error('PIN verification failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Invalid PIN';
        setError(errorMessage);
        setPin('');
      } finally {
        setLoading(false);
      }
    },
    [selectedMember, loading, dispatch, onSuccess, onClose]
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
