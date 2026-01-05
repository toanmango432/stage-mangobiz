import React from 'react';
import type { MembershipInfo } from '../types';
import { Card, Button } from './SharedComponents';

// Icons - must be defined before STATUS_CONFIG
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const PauseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CreditCardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

interface MembershipStatusCardProps {
  membership: MembershipInfo | undefined;
  onActivate: () => void;
  onRenew: () => void;
  onFreeze: () => void;
  onCancel: () => void;
}

type MembershipStatus = 'active' | 'expiring_soon' | 'expired' | 'frozen' | 'cancelled' | 'none';

const STATUS_CONFIG: Record<MembershipStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.FC<{ className?: string }>;
}> = {
  active: {
    label: 'Active',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircleIcon,
  },
  expiring_soon: {
    label: 'Expiring Soon',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: AlertIcon,
  },
  expired: {
    label: 'Expired',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircleIcon,
  },
  frozen: {
    label: 'Frozen',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: PauseIcon,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: XCircleIcon,
  },
  none: {
    label: 'No Membership',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: UserIcon,
  },
};

export const MembershipStatusCard: React.FC<MembershipStatusCardProps> = ({
  membership,
  onActivate,
  onRenew,
  onFreeze,
  onCancel,
}) => {
  const getMembershipStatus = (): MembershipStatus => {
    if (!membership?.hasMembership) return 'none';

    if (membership.membershipEndDate) {
      const endDate = new Date(membership.membershipEndDate);
      const now = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining < 0) return 'expired';
      if (daysRemaining <= 7) return 'expiring_soon';
    }

    return 'active';
  };

  const getDaysRemaining = (): number | null => {
    if (!membership?.membershipEndDate) return null;
    const endDate = new Date(membership.membershipEndDate);
    const now = new Date();
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getCreditUsagePercent = (): number => {
    if (!membership?.monthlyCredits) return 0;
    const used = (membership.monthlyCredits - (membership.creditsRemaining || 0));
    return Math.min(100, Math.round((used / membership.monthlyCredits) * 100));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  const status = getMembershipStatus();
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;
  const daysRemaining = getDaysRemaining();
  const creditUsage = getCreditUsagePercent();

  // No membership state
  if (status === 'none') {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <CreditCardIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Membership</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            This client doesn't have an active membership. Start one to unlock exclusive benefits and recurring revenue.
          </p>
          <Button variant="primary" onClick={onActivate}>
            <PlusIcon className="w-4 h-4" />
            Start Membership
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {/* Status Header */}
      <div className={`-mx-6 -mt-6 px-6 py-4 rounded-t-xl border-b ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${statusConfig.bgColor} border ${statusConfig.borderColor} flex items-center justify-center`}>
              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  {membership?.membershipType || 'Standard Membership'}
                </h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {formatCurrency(membership?.membershipPrice)}/month
                {membership?.autoRenew && (
                  <span className="ml-2 text-green-600">
                    <RefreshIcon className="w-3 h-3 inline" /> Auto-renew
                  </span>
                )}
              </p>
            </div>
          </div>

          {status === 'expiring_soon' && daysRemaining !== null && (
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600">{daysRemaining}</p>
              <p className="text-xs text-orange-600">days left</p>
            </div>
          )}
        </div>
      </div>

      {/* Membership Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Start Date</p>
          <p className="text-sm font-medium text-gray-900">
            {formatDate(membership?.membershipStartDate)}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">End Date</p>
          <p className="text-sm font-medium text-gray-900">
            {formatDate(membership?.membershipEndDate)}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Monthly Credits</p>
          <p className="text-sm font-medium text-gray-900">
            {membership?.monthlyCredits || 0}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Credits Left</p>
          <p className="text-sm font-medium text-cyan-600">
            {membership?.creditsRemaining || 0}
          </p>
        </div>
      </div>

      {/* Credit Usage Progress */}
      {(membership?.monthlyCredits ?? 0) > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Credit Usage This Month</span>
            <span className="text-sm text-gray-500">{creditUsage}% used</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                creditUsage > 90 ? 'bg-red-500' :
                creditUsage > 70 ? 'bg-orange-500' :
                'bg-cyan-500'
              }`}
              style={{ width: `${creditUsage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {membership?.creditsRemaining || 0} of {membership?.monthlyCredits || 0} credits remaining
          </p>
        </div>
      )}

      {/* Expiration Warning */}
      {status === 'expiring_soon' && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
          <AlertIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-800">Membership expiring soon</p>
            <p className="text-xs text-orange-600 mt-1">
              This membership will expire in {daysRemaining} days.
              {membership?.autoRenew
                ? ' It will automatically renew.'
                : ' Consider renewing to maintain benefits.'}
            </p>
          </div>
        </div>
      )}

      {/* Expired Warning */}
      {status === 'expired' && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Membership has expired</p>
            <p className="text-xs text-red-600 mt-1">
              This membership expired on {formatDate(membership?.membershipEndDate)}.
              Renew now to restore benefits.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
        {(status === 'expired' || status === 'expiring_soon') && (
          <Button variant="primary" onClick={onRenew}>
            <RefreshIcon className="w-4 h-4" />
            Renew Membership
          </Button>
        )}
        {status === 'active' && (
          <Button variant="outline" onClick={onFreeze}>
            <PauseIcon className="w-4 h-4" />
            Freeze
          </Button>
        )}
        {(status === 'active' || status === 'expiring_soon') && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel Membership
          </Button>
        )}
      </div>

      {/* Notes */}
      {membership?.notes && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Notes</p>
          <p className="text-sm text-gray-700">{membership.notes}</p>
        </div>
      )}
    </Card>
  );
};

export default MembershipStatusCard;
