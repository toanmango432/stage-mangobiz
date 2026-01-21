/**
 * Account & Licensing Settings Category
 * Account Info, Security, Subscription, License Management
 */

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  User,
  Shield,
  CreditCard,
  Key,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Monitor,
  RefreshCw,
  WifiOff,
  KeyRound,
  Trash2,
  Loader2,
  Fingerprint,
  ScanFace,
  Smartphone
} from 'lucide-react';
import { useMemberAuth } from '@/hooks/useMemberAuth';
import { selectMember } from '@/store/slices/authSlice';
import { memberAuthService } from '@/services/memberAuthService';
import { biometricService, type BiometricAvailability } from '@/services/biometricService';
import { totpService, type TOTPEnrollmentStatus } from '@/services/totpService';
import { otpService, type MfaMethod, type MfaPreference } from '@/services/otpService';
import { PinSetupModal } from '@/components/auth/PinSetupModal';
import { clearSkipPreference } from '@/components/auth/pinSetupUtils';
import { PinVerificationModal } from '@/components/auth/PinVerificationModal';
import { TOTPEnrollmentModal } from '@/components/auth/TOTPEnrollmentModal';
import {
  selectAccountSettings,
} from '@/store/slices/settingsSlice';
import { cn } from '@/lib/utils';

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

function SettingsSection({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <span className="text-amber-600">{icon}</span>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-gray-400">{icon}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function StatusBadge({ 
  status, 
  label 
}: { 
  status: 'active' | 'expired' | 'trial' | 'suspended'; 
  label: string;
}) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    trial: 'bg-blue-100 text-blue-800',
    suspended: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', colors[status])}>
      {label}
    </span>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AccountLicensingSettings() {
  const account = useSelector(selectAccountSettings);
  const { loginContext, memberSession } = useMemberAuth();
  const currentMember = useSelector(selectMember);

  // PIN-related state
  const [hasPinConfigured, setHasPinConfigured] = useState<boolean | null>(null);
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [showPinVerifyModal, setShowPinVerifyModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemovingPin, setIsRemovingPin] = useState(false);
  const [pinActionType, setPinActionType] = useState<'setup' | 'change'>('setup');

  // Biometric-related state
  const [biometricAvailability, setBiometricAvailability] = useState<BiometricAvailability | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean | null>(null);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [showBiometricRemoveConfirm, setShowBiometricRemoveConfirm] = useState(false);

  // Two-Factor Authentication state
  const [mfaPreference, setMfaPreference] = useState<MfaPreference | null>(null);
  const [selectedMfaMethod, setSelectedMfaMethod] = useState<MfaMethod>('none');
  const [otpDeliveryMethod, setOtpDeliveryMethod] = useState<'email' | 'sms'>('email');
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [showTotpEnrollModal, setShowTotpEnrollModal] = useState(false);
  const [showMfaDisableConfirm, setShowMfaDisableConfirm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  // Get current member ID from either session or Redux
  const memberId = memberSession?.memberId || currentMember?.memberId;
  const memberName = memberSession?.name || `${currentMember?.firstName || ''} ${currentMember?.lastName || ''}`.trim();

  // Check if PIN is configured on mount
  useEffect(() => {
    async function checkPinStatus() {
      if (!memberId) return;
      try {
        const hasPin = await memberAuthService.hasPin(memberId);
        setHasPinConfigured(hasPin);
      } catch (error) {
        console.error('Failed to check PIN status:', error);
        setHasPinConfigured(false);
      }
    }
    checkPinStatus();
  }, [memberId]);

  // Check biometric availability and enabled status on mount
  useEffect(() => {
    async function checkBiometricStatus() {
      try {
        const availability = await biometricService.isAvailable();
        setBiometricAvailability(availability);

        if (memberId && availability.available) {
          const enabled = await biometricService.isEnabled(memberId);
          setBiometricEnabled(enabled);
        } else {
          setBiometricEnabled(false);
        }
      } catch (error) {
        console.error('Failed to check biometric status:', error);
        setBiometricAvailability({ available: false, type: 'none', platformName: 'None', isNative: false });
        setBiometricEnabled(false);
      }
    }
    checkBiometricStatus();
  }, [memberId]);

  // Check MFA preference on mount (only for member-login context)
  useEffect(() => {
    async function checkMfaStatus() {
      if (loginContext !== 'member' || !memberId) {
        setMfaPreference({ method: 'none', isVerified: false });
        setSelectedMfaMethod('none');
        return;
      }
      try {
        const pref = await otpService.getMfaPreference(memberId);
        setMfaPreference(pref);
        setSelectedMfaMethod(pref.method);
        if (pref.method === 'email_otp') {
          setOtpDeliveryMethod('email');
        } else if (pref.method === 'sms_otp') {
          setOtpDeliveryMethod('sms');
          if (pref.phone) setPhoneNumber(pref.phone);
        }
      } catch (error) {
        console.error('Failed to check MFA status:', error);
        setMfaPreference({ method: 'none', isVerified: false });
        setSelectedMfaMethod('none');
      }
    }
    checkMfaStatus();
  }, [loginContext, memberId]);

  // Handle PIN setup/change completion
  const handlePinSetupComplete = useCallback(async () => {
    setShowPinSetupModal(false);
    setShowPinVerifyModal(false);
    setHasPinConfigured(true);
    // Clear skip preference since user set up PIN
    if (memberId) {
      clearSkipPreference(memberId);
    }
  }, [memberId]);

  // Handle "Set up PIN" button click
  const handleSetupPin = useCallback(() => {
    setPinActionType('setup');
    setShowPinSetupModal(true);
  }, []);

  // Handle "Change PIN" button click - requires current PIN verification first
  const handleChangePin = useCallback(() => {
    setPinActionType('change');
    setShowPinVerifyModal(true);
  }, []);

  // Handle PIN verification success (for change PIN flow)
  const handlePinVerifySuccess = useCallback(() => {
    setShowPinVerifyModal(false);
    setShowPinSetupModal(true);
  }, []);

  // Handle "Remove PIN" button click
  const handleRemoveClick = useCallback(() => {
    setShowRemoveConfirm(true);
  }, []);

  // Handle confirmed PIN removal
  const handleRemovePin = useCallback(async () => {
    if (!memberId) return;
    setIsRemovingPin(true);
    try {
      await memberAuthService.removePin(memberId);
      setHasPinConfigured(false);
      setShowRemoveConfirm(false);
    } catch (error) {
      console.error('Failed to remove PIN:', error);
    } finally {
      setIsRemovingPin(false);
    }
  }, [memberId]);

  // Handle biometric enable
  const handleEnableBiometric = useCallback(async () => {
    if (!memberId || !biometricAvailability?.available) return;
    setIsBiometricLoading(true);
    try {
      const success = await biometricService.register(memberId, memberName);
      if (success) {
        biometricService.setLastBiometricUser(memberId);
        setBiometricEnabled(true);
      }
    } catch (error) {
      console.error('Failed to enable biometric:', error);
    } finally {
      setIsBiometricLoading(false);
    }
  }, [memberId, memberName, biometricAvailability]);

  // Handle biometric disable click
  const handleDisableBiometricClick = useCallback(() => {
    setShowBiometricRemoveConfirm(true);
  }, []);

  // Handle confirmed biometric disable
  const handleDisableBiometric = useCallback(async () => {
    if (!memberId) return;
    setIsBiometricLoading(true);
    try {
      await biometricService.disable(memberId);
      setBiometricEnabled(false);
      setShowBiometricRemoveConfirm(false);
    } catch (error) {
      console.error('Failed to disable biometric:', error);
    } finally {
      setIsBiometricLoading(false);
    }
  }, [memberId]);

  // Handle MFA method selection change
  const handleMfaMethodChange = useCallback(async (method: MfaMethod) => {
    if (!memberId) return;

    // If selecting OTP, show phone input for SMS
    if (method === 'sms_otp' && !phoneNumber) {
      setShowPhoneInput(true);
      setSelectedMfaMethod(method);
      return;
    }

    // If selecting TOTP, show enrollment modal
    if (method === 'totp') {
      setSelectedMfaMethod(method);
      setShowTotpEnrollModal(true);
      return;
    }

    // For 'none' or 'email_otp', save directly
    setIsMfaLoading(true);
    try {
      await otpService.setMfaPreference(memberId, method);
      setSelectedMfaMethod(method);
      setMfaPreference({ method, isVerified: method !== 'none' });
      if (method === 'email_otp') {
        setOtpDeliveryMethod('email');
      }
    } catch (error) {
      console.error('Failed to update MFA method:', error);
    } finally {
      setIsMfaLoading(false);
    }
  }, [memberId, phoneNumber]);

  // Handle phone number submission for SMS OTP
  const handlePhoneSubmit = useCallback(async () => {
    if (!memberId || !phoneNumber.trim()) return;

    setIsMfaLoading(true);
    try {
      await otpService.setPhoneForSmsOtp(memberId, phoneNumber.trim());
      setSelectedMfaMethod('sms_otp');
      setOtpDeliveryMethod('sms');
      setMfaPreference({ method: 'sms_otp', phone: phoneNumber.trim(), isVerified: true });
      setShowPhoneInput(false);
    } catch (error) {
      console.error('Failed to save phone for SMS OTP:', error);
    } finally {
      setIsMfaLoading(false);
    }
  }, [memberId, phoneNumber]);

  // Handle TOTP enrollment completion
  const handleTotpEnrollComplete = useCallback(async () => {
    if (!memberId) return;
    setShowTotpEnrollModal(false);
    setIsMfaLoading(true);
    try {
      await otpService.setMfaPreference(memberId, 'totp');
      setMfaPreference({ method: 'totp', isVerified: true });
    } catch (error) {
      console.error('Failed to save TOTP preference:', error);
    } finally {
      setIsMfaLoading(false);
    }
  }, [memberId]);

  // Handle MFA disable
  const handleDisableMfa = useCallback(async () => {
    if (!memberId) return;
    setIsMfaLoading(true);
    try {
      // If TOTP was enabled, unenroll from Supabase MFA
      if (mfaPreference?.method === 'totp') {
        const status = await totpService.isEnrolled();
        if (status.enrolled && status.factorId) {
          await totpService.unenroll(status.factorId);
        }
      }
      await otpService.setMfaPreference(memberId, 'none');
      setSelectedMfaMethod('none');
      setMfaPreference({ method: 'none', isVerified: false });
      setShowMfaDisableConfirm(false);
    } catch (error) {
      console.error('Failed to disable MFA:', error);
    } finally {
      setIsMfaLoading(false);
    }
  }, [memberId, mfaPreference?.method]);

  if (!account) {
    return <div className="text-gray-500">Loading account settings...</div>;
  }

  const { info, security, subscription, license } = account;

  // Determine if we should show PIN settings (only for member-login context)
  const showPinSettings = loginContext === 'member' && memberId;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      free: 'Free',
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };
    return labels[plan] || plan;
  };

  const getTierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      free: 'Free Tier',
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };
    return labels[tier] || tier;
  };

  return (
    <div>
      {/* Account Information */}
      <SettingsSection title="Account Information" icon={<User className="w-5 h-5" />}>
        <InfoRow 
          icon={<Mail className="w-4 h-4" />} 
          label="Email" 
          value={info.email || 'Not set'} 
        />
        <InfoRow 
          icon={<Phone className="w-4 h-4" />} 
          label="Phone" 
          value={info.phone || 'Not set'} 
        />
        <InfoRow 
          icon={<User className="w-4 h-4" />} 
          label="Owner Name" 
          value={info.ownerName || 'Not set'} 
        />
        <InfoRow 
          icon={<Calendar className="w-4 h-4" />} 
          label="Account Created" 
          value={formatDate(info.createdAt)} 
        />
      </SettingsSection>

      {/* Security Settings */}
      <SettingsSection title="Security" icon={<Shield className="w-5 h-5" />}>
        <div className="space-y-4">
          {/* Two-Factor Authentication - Only visible for member-login users */}
          {loginContext === 'member' && (
            <div className="py-3 border-b border-gray-100">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    {isMfaLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>

              {/* MFA Method Selection */}
              {mfaPreference !== null && (
                <div className="ml-11 space-y-3">
                  {/* Option: None */}
                  <label className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedMfaMethod === 'none'
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}>
                    <input
                      type="radio"
                      name="mfa-method"
                      value="none"
                      checked={selectedMfaMethod === 'none'}
                      onChange={() => mfaPreference.method !== 'none' ? setShowMfaDisableConfirm(true) : null}
                      disabled={isMfaLoading}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">None</p>
                      <p className="text-sm text-gray-500">Password only (not recommended)</p>
                    </div>
                  </label>

                  {/* Option: OTP (Email or SMS) */}
                  <div className={cn(
                    "rounded-lg border transition-colors",
                    (selectedMfaMethod === 'email_otp' || selectedMfaMethod === 'sms_otp')
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  )}>
                    <label className="flex items-start gap-3 p-3 cursor-pointer">
                      <input
                        type="radio"
                        name="mfa-method"
                        value="otp"
                        checked={selectedMfaMethod === 'email_otp' || selectedMfaMethod === 'sms_otp'}
                        onChange={() => handleMfaMethodChange(otpDeliveryMethod === 'sms' ? 'sms_otp' : 'email_otp')}
                        disabled={isMfaLoading}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">One-Time Password (OTP)</p>
                        <p className="text-sm text-gray-500">Receive a code via email or SMS</p>
                      </div>
                    </label>

                    {/* OTP Delivery Method Sub-options */}
                    {(selectedMfaMethod === 'email_otp' || selectedMfaMethod === 'sms_otp') && (
                      <div className="px-3 pb-3 ml-7 space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Send code via:</p>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="otp-delivery"
                              value="email"
                              checked={otpDeliveryMethod === 'email'}
                              onChange={() => {
                                setOtpDeliveryMethod('email');
                                handleMfaMethodChange('email_otp');
                              }}
                              disabled={isMfaLoading}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">Email</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="otp-delivery"
                              value="sms"
                              checked={otpDeliveryMethod === 'sms'}
                              onChange={() => {
                                setOtpDeliveryMethod('sms');
                                handleMfaMethodChange('sms_otp');
                              }}
                              disabled={isMfaLoading}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">SMS</span>
                          </label>
                        </div>

                        {/* Phone number input for SMS */}
                        {showPhoneInput && otpDeliveryMethod === 'sms' && (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="Enter phone number"
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              onClick={handlePhoneSubmit}
                              disabled={!phoneNumber.trim() || isMfaLoading}
                              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Option: TOTP (Authenticator App) */}
                  <label className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedMfaMethod === 'totp'
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}>
                    <input
                      type="radio"
                      name="mfa-method"
                      value="totp"
                      checked={selectedMfaMethod === 'totp'}
                      onChange={() => handleMfaMethodChange('totp')}
                      disabled={isMfaLoading}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-gray-500" />
                        <p className="font-medium text-gray-900">Authenticator App</p>
                        {selectedMfaMethod === 'totp' && mfaPreference.isVerified && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Use Google Authenticator, 1Password, Authy, or similar
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Disable MFA Confirmation */}
              {showMfaDisableConfirm && (
                <div className="mt-4 ml-11 p-4 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">Disable Two-Factor Authentication?</p>
                  <p className="text-sm text-red-600 mt-1">
                    Your account will be less secure without two-factor authentication.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleDisableMfa}
                      disabled={isMfaLoading}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isMfaLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                      Yes, Disable
                    </button>
                    <button
                      onClick={() => setShowMfaDisableConfirm(false)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-500">
                Last changed: {security.lastPasswordChange ? formatDate(security.lastPasswordChange) : 'Never'}
              </p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Active Sessions</p>
              <p className="text-sm text-gray-500">Manage your logged-in devices</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              View Sessions
            </button>
          </div>

          {/* Offline Access PIN - Only visible for member-login users */}
          {showPinSettings && (
            <div className="py-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Offline Access PIN</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {hasPinConfigured
                        ? 'PIN is configured for offline access'
                        : 'Set up a PIN for quick offline access'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>PIN allows you to switch users when offline. Without PIN, you need internet to switch users.</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasPinConfigured === null ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : hasPinConfigured ? (
                    <>
                      <button
                        onClick={handleChangePin}
                        className="px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        Change PIN
                      </button>
                      <button
                        onClick={handleRemoveClick}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleSetupPin}
                      className="px-4 py-2 text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-colors"
                    >
                      Set up PIN
                    </button>
                  )}
                </div>
              </div>

              {/* Remove PIN Confirmation */}
              {showRemoveConfirm && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">Remove PIN?</p>
                  <p className="text-sm text-red-600 mt-1">
                    You will need internet access to switch users after removing your PIN.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleRemovePin}
                      disabled={isRemovingPin}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isRemovingPin && <Loader2 className="w-3 h-3 animate-spin" />}
                      Yes, Remove
                    </button>
                    <button
                      onClick={() => setShowRemoveConfirm(false)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Biometric Authentication - Only visible if biometrics are available */}
          {biometricAvailability?.available && memberId && (
            <div className="py-3 border-t border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    {biometricAvailability.type === 'face' ? (
                      <ScanFace className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Fingerprint className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{biometricAvailability.platformName}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {biometricEnabled
                        ? `${biometricAvailability.platformName} is enabled for quick login`
                        : `Enable ${biometricAvailability.platformName} for faster sign-in`}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Your biometric data never leaves this device</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {biometricEnabled === null || isBiometricLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : biometricEnabled ? (
                    <button
                      onClick={handleDisableBiometricClick}
                      disabled={isBiometricLoading}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Disable
                    </button>
                  ) : (
                    <button
                      onClick={handleEnableBiometric}
                      disabled={isBiometricLoading}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isBiometricLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                      Enable {biometricAvailability.platformName}
                    </button>
                  )}
                </div>
              </div>

              {/* Remove Biometric Confirmation */}
              {showBiometricRemoveConfirm && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">Disable {biometricAvailability.platformName}?</p>
                  <p className="text-sm text-red-600 mt-1">
                    You will need to use your password or PIN to sign in.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleDisableBiometric}
                      disabled={isBiometricLoading}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isBiometricLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                      Yes, Disable
                    </button>
                    <button
                      onClick={() => setShowBiometricRemoveConfirm(false)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Subscription */}
      <SettingsSection title="Subscription" icon={<CreditCard className="w-5 h-5" />}>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Plan</p>
              <p className="text-2xl font-bold text-gray-900">{getPlanLabel(subscription.plan)}</p>
            </div>
            <button className="px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>

        <InfoRow 
          icon={<RefreshCw className="w-4 h-4" />} 
          label="Billing Cycle" 
          value={subscription.billingCycle === 'annual' ? 'Annual' : 'Monthly'} 
        />
        <InfoRow 
          icon={<Calendar className="w-4 h-4" />} 
          label="Next Billing Date" 
          value={subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : 'N/A'} 
        />
        <InfoRow 
          icon={<CreditCard className="w-4 h-4" />} 
          label="Payment Method" 
          value={subscription.paymentMethodLast4 ? `•••• ${subscription.paymentMethodLast4}` : 'Not set'} 
        />
      </SettingsSection>

      {/* License Information */}
      <SettingsSection title="License" icon={<Key className="w-5 h-5" />}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">License Status</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={license.status} label={license.status.charAt(0).toUpperCase() + license.status.slice(1)} />
              <span className="text-sm text-gray-500">{getTierLabel(license.tier)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-500 mb-1">License Key</p>
          <p className="font-mono text-sm text-gray-900">{license.key || 'No license key'}</p>
        </div>

        <InfoRow 
          icon={<Calendar className="w-4 h-4" />} 
          label="Activation Date" 
          value={formatDate(license.activationDate)} 
        />
        <InfoRow 
          icon={<Clock className="w-4 h-4" />} 
          label="Expiration Date" 
          value={license.expirationDate ? formatDate(license.expirationDate) : 'No expiration'} 
        />
        <InfoRow 
          icon={<Monitor className="w-4 h-4" />} 
          label="Devices" 
          value={`${license.devicesActive} / ${license.devicesAllowed} active`} 
        />

        <div className="flex gap-3 mt-6">
          <button className="flex-1 px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors">
            Activate License
          </button>
          <button className="px-4 py-2 text-amber-600 font-medium border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors">
            Renew
          </button>
        </div>
      </SettingsSection>

      {/* PIN Setup Modal */}
      {memberId && (
        <PinSetupModal
          isOpen={showPinSetupModal}
          onClose={() => setShowPinSetupModal(false)}
          onSubmit={handlePinSetupComplete}
          onSkip={() => setShowPinSetupModal(false)}
          memberId={memberId}
          memberName={memberName}
          isRequired={false}
        />
      )}

      {/* PIN Verification Modal (for changing PIN) */}
      {memberId && (
        <PinVerificationModal
          isOpen={showPinVerifyModal}
          onClose={() => setShowPinVerifyModal(false)}
          onSuccess={handlePinVerifySuccess}
          memberId={memberId}
          actionDescription="Verify your current PIN to set a new one"
        />
      )}

      {/* TOTP Enrollment Modal */}
      <TOTPEnrollmentModal
        isOpen={showTotpEnrollModal}
        onClose={() => setShowTotpEnrollModal(false)}
        onSuccess={handleTotpEnrollComplete}
      />
    </div>
  );
}

export default AccountLicensingSettings;
