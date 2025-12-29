/**
 * Account & Licensing Settings Category
 * Account Info, Security, Subscription, License Management
 */

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
  RefreshCw
} from 'lucide-react';
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

  if (!account) {
    return <div className="text-gray-500">Loading account settings...</div>;
  }

  const { info, security, subscription, license } = account;

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

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Active Sessions</p>
              <p className="text-sm text-gray-500">Manage your logged-in devices</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              View Sessions
            </button>
          </div>
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
    </div>
  );
}

export default AccountLicensingSettings;
