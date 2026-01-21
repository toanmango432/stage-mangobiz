/**
 * SwitchUserModal Component
 *
 * Modal for switching between staff members with context-aware authentication.
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

import { X, WifiOff, ArrowLeft } from 'lucide-react';
import { MemberList } from './MemberList';
import { PinStep } from './PinStep';
import { PasswordStep } from './PasswordStep';
import { SuccessStep } from './SuccessStep';
import { useSwitchUser } from './hooks/useSwitchUser';
import type { SwitchUserModalProps } from './types';

export function SwitchUserModal({
  isOpen,
  onClose,
  onSuccess,
  loginContext = 'store',
  isOnline = true,
}: SwitchUserModalProps) {
  const {
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
  } = useSwitchUser({
    isOpen,
    onClose,
    onSuccess,
    loginContext,
    isOnline,
  });

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
                className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back to member selection"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
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
            <MemberList
              members={members}
              currentMember={currentMember}
              fetchingMembers={fetchingMembers}
              error={error}
              isOnline={isOnline}
              loginContext={loginContext}
              onMemberSelect={handleMemberSelect}
              onLogoutCurrentMember={handleLogoutCurrentMember}
              onRetry={handleRetry}
            />
          )}

          {/* Step 2a: Enter PIN */}
          {step === 'pin' && selectedMember && (
            <PinStep
              selectedMember={selectedMember}
              pin={pin}
              error={error}
              loading={loading}
              loginContext={loginContext}
              isOnline={isOnline}
              onPinChange={handlePinChange}
              onPinComplete={handlePinComplete}
              onPinSubmit={handlePinSubmit}
            />
          )}

          {/* Step 2b: Enter Password */}
          {step === 'password' && selectedMember && (
            <PasswordStep
              selectedMember={selectedMember}
              password={password}
              showPassword={showPassword}
              error={error}
              loading={loading}
              passwordInputRef={passwordInputRef}
              onPasswordChange={handlePasswordChange}
              onShowPasswordToggle={handleShowPasswordToggle}
              onSubmit={handlePasswordSubmit}
            />
          )}

          {/* Step 3: Success */}
          {step === 'success' && selectedMember && (
            <SuccessStep selectedMember={selectedMember} />
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
