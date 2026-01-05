/**
 * Switch User Modal
 * Allows staff members to take over the front desk POS terminal
 * by selecting their name and entering their PASSWORD.
 *
 * Note: PINs are for accessing restricted pages within the app,
 * passwords are for user authentication/switching.
 *
 * Use case: Receptionist shift handover
 */

import { useState, useEffect, useRef } from 'react';
import { X, User, Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectStoreId, selectMember, setMemberSession, clearMemberSession } from '../../store/slices/authSlice';
import { authService, type MemberSession } from '../../services/supabase/authService';

interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (member: MemberSession) => void;
}

type Step = 'select' | 'pin' | 'success';

export function SwitchUserModal({ isOpen, onClose, onSuccess }: SwitchUserModalProps) {
  const dispatch = useAppDispatch();
  const storeId = useAppSelector(selectStoreId);
  const currentMember = useAppSelector(selectMember);

  const [step, setStep] = useState<Step>('select');
  const [members, setMembers] = useState<MemberSession[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberSession | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  // Focus password input when step changes to 'pin' (password step)
  useEffect(() => {
    if (step === 'pin' && passwordInputRef.current) {
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
      setError(null);
    }
  }, [isOpen]);

  const fetchMembers = async () => {
    if (!storeId) return;

    setFetchingMembers(true);
    try {
      const storeMembers = await authService.getStoreMembers(storeId);
      setMembers(storeMembers);
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError('Failed to load staff members');
    } finally {
      setFetchingMembers(false);
    }
  };

  const handleMemberSelect = (member: MemberSession) => {
    setSelectedMember(member);
    setError(null);
    setStep('pin');
  };

  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!storeId || !selectedMember || !password) return;

    setLoading(true);
    setError(null);

    try {
      // Use password authentication for the selected member
      const memberSession = await authService.loginMemberWithPassword(
        selectedMember.email,
        password,
        storeId
      );

      // Update Redux state
      dispatch(setMemberSession({
        memberId: memberSession.memberId,
        memberName: `${memberSession.firstName} ${memberSession.lastName}`.trim(),
        firstName: memberSession.firstName,
        lastName: memberSession.lastName,
        email: memberSession.email,
        role: memberSession.role as 'owner' | 'manager' | 'staff' | 'receptionist' | 'junior',
        avatarUrl: memberSession.avatarUrl || undefined,
        permissions: memberSession.permissions || undefined,
      }));

      // Show success briefly
      setStep('success');
      setTimeout(() => {
        onSuccess?.(memberSession);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Password verification failed:', err);
      setError(err.message || 'Invalid password');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('select');
    setSelectedMember(null);
    setPassword('');
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
            {step === 'pin' && (
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
              {step === 'pin' && 'Enter Password'}
              {step === 'success' && 'Success'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
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
                      return (
                        <button
                          key={member.memberId}
                          onClick={() => !isCurrentUser && handleMemberSelect(member)}
                          disabled={isCurrentUser}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-xl border transition-all
                            ${isCurrentUser
                              ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
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
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getRoleColor(member.role)}`}>
                                {getRoleLabel(member.role)}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] text-blue-600">Current</span>
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

          {/* Step 2: Enter Password */}
          {step === 'pin' && selectedMember && (
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
              Staff members need their password to sign in. Manage accounts in Team Settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SwitchUserModal;
