/**
 * Switch User Modal
 * Allows staff members to switch users with context-aware authentication.
 *
 * Authentication behavior depends on login context and online/offline status:
 *
 * STORE-LOGIN CONTEXT (shared device):
 * - Always requires PIN verification
 * - Staff list loaded from store members
 *
 * MEMBER-LOGIN CONTEXT + ONLINE:
 * - Shows email/password login form
 * - Other user logs in with their own Supabase Auth credentials
 *
 * MEMBER-LOGIN CONTEXT + OFFLINE:
 * - Shows PIN input if member has PIN configured
 * - Otherwise shows "Connect to internet to switch users"
 *
 * @see docs/AUTH_MIGRATION_PLAN.md
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, User, Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Wifi, WifiOff, Clock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectStoreId, selectMember, setMemberSession, clearMemberSession } from '../../store/slices/authSlice';
import { authService, type MemberSession } from '../../services/supabase/authService';
import { memberAuthService } from '../../services/memberAuthService';
import { PinInput } from './PinInput';
import type { LoginContext, PinLockoutInfo, GraceInfo } from '@/types/memberAuth';
import type { MemberRole } from '../../services/supabase/types';

interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (member: MemberSession) => void;
  /** Login context - determines verification method */
  loginContext?: LoginContext;
  /** Online status - affects available verification methods */
  isOnline?: boolean;
}

/** Steps in the switch user flow */
type Step = 'select' | 'pin' | 'password' | 'success';

/** Extended member data for display with PIN status */
interface DisplayMember extends MemberSession {
  hasPinSetup?: boolean;
  lockoutInfo?: PinLockoutInfo;
  graceInfo?: GraceInfo;
}

export function SwitchUserModal({
  isOpen,
  onClose,
  onSuccess,
  loginContext = 'store',
  isOnline = true,
}: SwitchUserModalProps) {
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
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError('Failed to load staff members');
    } finally {
      setFetchingMembers(false);
    }
  };

  /**
   * Determine the appropriate verification step based on context and online status.
   *
   * STORE-LOGIN: Always PIN (required for shared device security)
   * MEMBER-LOGIN + ONLINE: Password (normal Supabase Auth)
   * MEMBER-LOGIN + OFFLINE: PIN (if available), otherwise block
   */
  const getVerificationStep = useCallback(
    (member: DisplayMember): Step | null => {
      if (loginContext === 'store') {
        // Store-login: Always PIN
        return 'pin';
      }

      // Member-login context
      if (isOnline) {
        // Online: Use password (normal Supabase Auth)
        return 'password';
      }

      // Offline: Check if PIN is available
      if (member.hasPinSetup) {
        return 'pin';
      }

      // Offline without PIN - cannot switch
      return null;
    },
    [loginContext, isOnline]
  );

  const handleMemberSelect = (member: DisplayMember) => {
    setSelectedMember(member);
    setError(null);
    setPin('');
    setPassword('');

    // Check if member is locked out (only relevant for PIN verification)
    if (member.lockoutInfo?.isLocked) {
      setError(`PIN locked. Try again in ${member.lockoutInfo.remainingMinutes} minutes.`);
      return;
    }

    // Determine verification step
    const nextStep = getVerificationStep(member);

    if (nextStep === null) {
      // Member-login offline without PIN configured
      setError('Connect to internet to switch to this user (no PIN configured).');
      return;
    }

    setStep(nextStep);
  };

  /**
   * Handle password submission (member-login + online)
   * Uses memberAuthService.loginWithPassword for Supabase Auth
   */
  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!storeId || !selectedMember || !password) return;

    setLoading(true);
    setError(null);

    try {
      // Use Supabase Auth password authentication
      const authSession = await memberAuthService.loginWithPassword(
        selectedMember.email,
        password
      );

      // Map MemberAuthSession to Redux MemberSession format
      const nameParts = authSession.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update Redux state
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

      // Start grace checker for session monitoring
      memberAuthService.startGraceChecker();

      // Show success briefly
      setStep('success');
      setTimeout(() => {
        // Create MemberSession-compatible object for callback
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
  };

  /**
   * Handle PIN submission (store-login OR member-login + offline)
   * Uses memberAuthService.loginWithPin for bcrypt verification
   */
  const handlePinSubmit = async () => {
    if (!selectedMember || !pin) return;

    setLoading(true);
    setError(null);

    try {
      // Validate PIN using memberAuthService
      const authSession = await memberAuthService.loginWithPin(
        selectedMember.memberId,
        pin
      );

      // Map MemberAuthSession to Redux MemberSession format
      const nameParts = authSession.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update Redux state
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

      // Show success briefly
      setStep('success');
      setTimeout(() => {
        // Create MemberSession-compatible object for callback
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
  };

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
        // Validate PIN using memberAuthService
        const authSession = await memberAuthService.loginWithPin(
          selectedMember.memberId,
          completedPin
        );

        // Map MemberAuthSession to Redux MemberSession format
        const nameParts = authSession.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Update Redux state
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

        // Show success briefly
        setStep('success');
        setTimeout(() => {
          // Create MemberSession-compatible object for callback
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

  const handleBack = () => {
    setStep('select');
    setSelectedMember(null);
    setPassword('');
    setPin('');
    setShowPassword(false);
    setError(null);
  };

  const handleLogoutCurrentMember = () => {
    dispatch(clearMemberSession());
    setError(null);
  };

  const getInitials = (member: MemberSession) => {
    const first = member.firstName?.[0] || '';
    const last = member.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Owner',
      manager: 'Manager',
      staff: 'Staff',
      receptionist: 'Receptionist',
      junior: 'Junior',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-700',
      manager: 'bg-blue-100 text-blue-700',
      staff: 'bg-green-100 text-green-700',
      receptionist: 'bg-orange-100 text-orange-700',
      junior: 'bg-gray-100 text-gray-600',
    };
    return colors[role] || 'bg-gray-100 text-gray-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {(step === 'pin' || step === 'password') && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              {step === 'select' && 'Switch User'}
              {step === 'pin' && 'Enter PIN'}
              {step === 'password' && 'Enter Password'}
              {step === 'success' && 'Success'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Offline indicator */}
            {!isOnline && step === 'select' && (
              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Staff Member */}
          {step === 'select' && (
            <div className="space-y-4">
              {/* Current User Indicator */}
              {currentMember && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {getInitials(currentMember as any)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {currentMember.firstName} {currentMember.lastName}
                      </p>
                      <p className="text-xs text-blue-600">Currently signed in</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogoutCurrentMember}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Sign out
                  </button>
                </div>
              )}

              {/* Staff List */}
              <div>
                <p className="text-sm text-gray-500 mb-3">
                  Select a staff member to switch to:
                </p>

                {fetchingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    <span className="ml-2 text-gray-500">Loading staff...</span>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No staff members found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Add staff in Team Settings
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {members.map((member) => {
                      const isCurrentUser = currentMember?.memberId === member.memberId;
                      const isLocked = member.lockoutInfo?.isLocked;
                      const needsPinButHasNone =
                        (loginContext === 'store' || !isOnline) && !member.hasPinSetup;
                      const hasGraceWarning =
                        loginContext === 'store' &&
                        member.graceInfo &&
                        member.graceInfo.daysRemaining <= 2 &&
                        member.graceInfo.isValid;

                      return (
                        <button
                          key={member.memberId}
                          onClick={() => !isCurrentUser && handleMemberSelect(member)}
                          disabled={isCurrentUser}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-xl border transition-all
                            ${isCurrentUser
                              ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                              : isLocked
                                ? 'bg-red-50 border-red-200 cursor-pointer'
                                : needsPinButHasNone
                                  ? 'bg-amber-50 border-amber-200 cursor-pointer'
                                  : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                            }
                          `}
                        >
                          {/* Avatar */}
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={`${member.firstName} ${member.lastName}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {getInitials(member)}
                            </div>
                          )}

                          {/* Name & Role */}
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getRoleColor(member.role)}`}>
                                {getRoleLabel(member.role)}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] text-blue-600">Current</span>
                              )}
                              {isLocked && (
                                <span className="text-[10px] text-red-600 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" />
                                  Locked ({member.lockoutInfo?.remainingMinutes}m)
                                </span>
                              )}
                              {needsPinButHasNone && !isOnline && (
                                <span className="text-[10px] text-amber-600 flex items-center gap-1">
                                  <WifiOff className="w-2.5 h-2.5" />
                                  No PIN
                                </span>
                              )}
                              {hasGraceWarning && (
                                <span className="text-[10px] text-amber-600 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {member.graceInfo?.daysRemaining}d left
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Arrow */}
                          {!isCurrentUser && (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2a: Enter PIN (store-login OR member-login + offline) */}
          {step === 'pin' && selectedMember && (
            <div className="space-y-6">
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
                <p className={`text-xs font-medium px-3 py-1 rounded-full inline-block mt-2 ${getRoleColor(selectedMember.role)}`}>
                  {getRoleLabel(selectedMember.role)}
                </p>
              </div>

              {/* Grace period warning (store-login only) */}
              {loginContext === 'store' &&
                selectedMember.graceInfo &&
                selectedMember.graceInfo.daysRemaining <= 2 &&
                selectedMember.graceInfo.isValid && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {selectedMember.graceInfo.daysRemaining} day
                      {selectedMember.graceInfo.daysRemaining !== 1 ? 's' : ''} of offline access remaining.
                      Connect to internet to extend.
                    </span>
                  </div>
                )}

              {/* Offline indicator for member-login context */}
              {loginContext === 'member' && !isOnline && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                  <WifiOff className="w-4 h-4 flex-shrink-0" />
                  <span>Offline - Using PIN for verification</span>
                </div>
              )}

              {/* PIN Input */}
              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Enter your PIN
                </label>
                <PinInput
                  value={pin}
                  onChange={(value) => {
                    setPin(value);
                    setError(null);
                  }}
                  length={4}
                  disabled={loading}
                  error={!!error}
                  autoFocus
                  onComplete={handlePinComplete}
                />

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 mt-4 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handlePinSubmit}
                disabled={loading || pin.length < 4}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify PIN</span>
                )}
              </button>

              {/* Forgot PIN hint */}
              <p className="text-xs text-center text-gray-400">
                Forgot PIN? Contact your manager to reset.
              </p>
            </div>
          )}

          {/* Step 2b: Enter Password (member-login + online) */}
          {step === 'password' && selectedMember && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
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
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter password"
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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
          )}

          {/* Step 3: Success */}
          {step === 'success' && selectedMember && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Welcome, {selectedMember.firstName}!
              </h3>
              <p className="text-sm text-gray-500">
                You're now signed in to the front desk.
              </p>
            </div>
          )}
        </div>

        {/* Footer - Only show on select step */}
        {step === 'select' && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              {loginContext === 'store'
                ? 'Staff members need their PIN to sign in. Manage accounts in Team Settings.'
                : isOnline
                  ? 'Staff members need their password to sign in. Manage accounts in Team Settings.'
                  : 'Offline: Staff need their PIN to switch. Connect to internet for full access.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SwitchUserModal;
