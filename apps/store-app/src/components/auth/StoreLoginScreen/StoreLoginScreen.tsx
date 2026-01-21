/**
 * StoreLoginScreen Component
 *
 * Main login screen supporting two authentication modes:
 * 1. Store Login: Store credentials (email + password) - for shared POS devices
 * 2. Member Login: Member credentials (email + password) via Supabase Auth
 *
 * Member Login uses Supabase Auth for enhanced security with optional PIN setup.
 */

import { useEffect } from 'react';
import { Store, WifiOff, XCircle, User } from 'lucide-react';
import { storeAuthManager } from '../../../services/storeAuthManager';
import { PinSetupModal } from '../PinSetupModal';
import { ForgotPasswordModal } from '../ForgotPasswordModal';
import { BiometricEnrollmentModal } from '../BiometricEnrollmentModal';
import { TOTPVerificationModal } from '../TOTPVerificationModal';
import { LoginForm } from './LoginForm';
import { MemberLoginForm } from './MemberLoginForm';
import { PinScreen } from './PinScreen';
import { useLoginState } from './hooks/useLoginState';
import type { StoreLoginScreenProps } from './types';

export function StoreLoginScreen({ onLoggedIn, initialState }: StoreLoginScreenProps) {
  const state = initialState || storeAuthManager.getState();

  const {
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
    // Magic link state
    magicLinkSent,
    magicLinkEmail,
    magicLinkCooldown,
    isSendingMagicLink,
    // Biometric state
    biometricAvailable,
    biometricType,
    biometricPlatformName,
    biometricEnabled,
    isBiometricLoading,
    // Biometric enrollment state
    showBiometricEnrollment,
    biometricEnrollmentMember,
    // TOTP verification state
    showTotpVerification,

    // Actions
    loadMembers,
    handleLogin,
    handleMemberLogin,
    handlePinSetupComplete,
    handlePinSetupSkip,
    handleForgotPassword,
    handleSendMagicLink,
    handleBiometricLogin,
    handleBiometricEnrollmentComplete,
    handleBiometricEnrollmentClose,
    handlePinChange,
    handlePinKeyPress,
    handlePinBackspace,
    handleLogoutStore,
    handleKeyDown,
    handleMemberKeyDown,
    handleLoginModeChange,
    handleShowMemberPasswordToggle,
    handlePinKeyDown,
    handleTotpVerificationSuccess,
    handleTotpVerificationCancel,
  } = useLoginState({ onLoggedIn });

  // Load members when store is logged in
  useEffect(() => {
    if (state.status === 'store_logged_in' && state.store?.storeId) {
      loadMembers();
    }
  }, [state.status, state.store?.storeId, loadMembers]);

  // Sync error from initialState when login fails
  useEffect(() => {
    if (
      initialState?.status === 'not_logged_in' &&
      initialState?.message &&
      !isLoginAttemptRef.current
    ) {
      if (
        !isLoading &&
        initialState.message !== 'Please log in to your store.' &&
        initialState.message !== 'Logged out.'
      ) {
        // Error is synced from initialState
      }
    }
  }, [initialState?.status, initialState?.message, isLoading, isLoginAttemptRef]);

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
      <PinScreen
        storeName={state.store?.storeName || 'Your Store'}
        members={members}
        loadingMembers={loadingMembers}
        pin={pin}
        error={error}
        success={success}
        isLoading={isLoading}
        onPinChange={handlePinChange}
        onPinKeyPress={handlePinKeyPress}
        onPinBackspace={handlePinBackspace}
        onPinKeyDown={handlePinKeyDown}
        onLogoutStore={handleLogoutStore}
      />
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
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
              loginMode === 'member'
                ? 'bg-gradient-to-br from-brand-500 to-amber-500'
                : 'bg-gradient-to-br from-orange-500 to-pink-500'
            }`}
          >
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

        {/* Store Login Link (shown only in member login mode) */}
        {loginMode === 'member' && (
          <p className="text-center text-sm text-gray-500">
            Logging into a shared device?{' '}
            <button
              type="button"
              onClick={() => handleLoginModeChange('store')}
              className="text-brand-600 hover:text-brand-700 font-medium hover:underline"
            >
              Use Store Login
            </button>
          </p>
        )}

        {/* Back to Staff Login (shown only in store login mode) */}
        {loginMode === 'store' && (
          <p className="text-center text-sm text-gray-500">
            <button
              type="button"
              onClick={() => handleLoginModeChange('member')}
              className="text-brand-600 hover:text-brand-700 font-medium hover:underline inline-flex items-center gap-1"
            >
              ← Back to Staff Login
            </button>
          </p>
        )}

        {/* Form based on mode */}
        {loginMode === 'member' ? (
          <MemberLoginForm
            email={memberEmail}
            setEmail={setMemberEmail}
            password={memberPassword}
            setPassword={setMemberPassword}
            showPassword={showMemberPassword}
            onShowPasswordToggle={handleShowMemberPasswordToggle}
            isLoading={isLoading}
            error={error}
            success={success}
            onLogin={handleMemberLogin}
            onKeyDown={handleMemberKeyDown}
            isOnline={isOnline}
            onForgotPassword={handleForgotPassword}
            onSendMagicLink={handleSendMagicLink}
            magicLinkSent={magicLinkSent}
            magicLinkEmail={magicLinkEmail}
            magicLinkCooldown={magicLinkCooldown}
            isSendingMagicLink={isSendingMagicLink}
            biometricAvailable={biometricAvailable}
            biometricType={biometricType}
            biometricPlatformName={biometricPlatformName}
            biometricEnabled={biometricEnabled}
            onBiometricLogin={handleBiometricLogin}
            isBiometricLoading={isBiometricLoading}
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
              <p className="text-emerald-500 italic mb-1">
                Requires running: <span className="font-mono">pnpm create-test-users</span>
              </p>
              <p>
                Owner: <span className="font-mono">owner@demosalon.com</span> /{' '}
                <span className="font-mono">owner123</span>
              </p>
              <p>
                Staff: <span className="font-mono">jane@demosalon.com</span> /{' '}
                <span className="font-mono">jane123</span>
              </p>
            </div>
          ) : (
            <div className="space-y-1 text-xs text-emerald-600">
              <p>
                <span className="font-mono">mango001</span> /{' '}
                <span className="font-mono">password123</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PIN Setup Modal */}
      <PinSetupModal
        isOpen={showPinSetupModal}
        onClose={handlePinSetupComplete}
        onSubmit={handlePinSetupComplete}
        onSkip={handlePinSetupSkip}
        memberId={pinSetupMember?.memberId || ''}
        memberName={pinSetupMember?.name || ''}
        isRequired={false}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        defaultEmail={memberEmail}
      />

      {/* Biometric Enrollment Modal */}
      <BiometricEnrollmentModal
        isOpen={showBiometricEnrollment}
        onClose={handleBiometricEnrollmentClose}
        onEnroll={handleBiometricEnrollmentComplete}
        memberId={biometricEnrollmentMember?.memberId || ''}
        memberName={biometricEnrollmentMember?.memberName || ''}
        biometricType={biometricType}
        platformName={biometricPlatformName}
      />

      {/* TOTP Verification Modal */}
      <TOTPVerificationModal
        isOpen={showTotpVerification}
        onClose={handleTotpVerificationCancel}
        onSuccess={handleTotpVerificationSuccess}
        onCancel={handleTotpVerificationCancel}
      />
    </div>
  );
}

export default StoreLoginScreen;
