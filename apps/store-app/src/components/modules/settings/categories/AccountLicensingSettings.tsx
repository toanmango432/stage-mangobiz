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
  Loader2
} from 'lucide-react';
import { useMemberAuth } from '@/providers/AuthProvider';
import { selectMember } from '@/store/slices/authSlice';
import { memberAuthService } from '@/services/memberAuthService';
import { PinSetupModal, clearSkipPreference } from '@/components/auth/PinSetupModal';
import { PinVerificationModal } from '@/components/auth/PinVerificationModal';
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
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <div className="flex items-center gap-2">
              {security.twoFactorEnabled ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Enabled</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600">Disabled</span>
                </>
              )}
            </div>
          </div>

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
    </div>
  );
}

export default AccountLicensingSettings;
