import React, { useState } from 'react';
import type { EnhancedClient, MembershipInfo } from '../types';
import { Card, Button, Input, Select, Toggle, Textarea } from '../components/SharedComponents';
import { MembershipStatusCard } from '../components/MembershipStatusCard';

interface MembershipSectionProps {
  client: EnhancedClient;
  onChange: (updates: Partial<EnhancedClient>) => void;
}

// Available membership plans
const MEMBERSHIP_PLANS = [
  { id: 'basic', name: 'Basic', price: 49, credits: 1, description: 'Perfect for occasional visits' },
  { id: 'standard', name: 'Standard', price: 99, credits: 2, description: 'Our most popular plan' },
  { id: 'premium', name: 'Premium', price: 149, credits: 4, description: 'Best value for regulars' },
  { id: 'vip', name: 'VIP', price: 249, credits: 8, description: 'Ultimate pampering experience' },
  { id: 'custom', name: 'Custom', price: 0, credits: 0, description: 'Create a custom plan' },
];

type ModalType = 'activate' | 'renew' | 'freeze' | 'cancel' | 'edit' | null;

export const MembershipSection: React.FC<MembershipSectionProps> = ({ client, onChange }) => {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('standard');
  const [customMembership, setCustomMembership] = useState<Partial<MembershipInfo>>({
    membershipType: '',
    membershipPrice: 0,
    monthlyCredits: 0,
    autoRenew: true,
  });
  const [freezeDuration, setFreezeDuration] = useState<number>(30);
  const [cancelReason, setCancelReason] = useState<string>('');

  const updateMembership = (updates: Partial<MembershipInfo>) => {
    onChange({
      membership: {
        ...client.membership,
        hasMembership: client.membership?.hasMembership ?? false,
        ...updates,
      },
    });
  };

  const handleActivateMembership = () => {
    const plan = MEMBERSHIP_PLANS.find(p => p.id === selectedPlan);
    if (!plan) return;

    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const membershipData: MembershipInfo = selectedPlan === 'custom' ? {
      hasMembership: true,
      membershipType: customMembership.membershipType || 'Custom',
      membershipPrice: customMembership.membershipPrice || 0,
      membershipStartDate: startDate,
      membershipEndDate: endDate.toISOString().split('T')[0],
      monthlyCredits: customMembership.monthlyCredits || 0,
      creditsRemaining: customMembership.monthlyCredits || 0,
      autoRenew: customMembership.autoRenew ?? true,
    } : {
      hasMembership: true,
      membershipType: plan.name,
      membershipPrice: plan.price,
      membershipStartDate: startDate,
      membershipEndDate: endDate.toISOString().split('T')[0],
      monthlyCredits: plan.credits,
      creditsRemaining: plan.credits,
      autoRenew: true,
    };

    onChange({ membership: membershipData });
    setModalType(null);
  };

  const handleRenewMembership = () => {
    if (!client.membership) return;

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    updateMembership({
      membershipEndDate: endDate.toISOString().split('T')[0],
      creditsRemaining: client.membership.monthlyCredits || 0,
    });
    setModalType(null);
  };

  const handleFreezeMembership = () => {
    // In production, would extend end date by freeze duration
    const currentEnd = client.membership?.membershipEndDate
      ? new Date(client.membership.membershipEndDate)
      : new Date();
    currentEnd.setDate(currentEnd.getDate() + freezeDuration);

    updateMembership({
      membershipEndDate: currentEnd.toISOString().split('T')[0],
      notes: `${client.membership?.notes || ''}\n[Frozen for ${freezeDuration} days on ${new Date().toLocaleDateString()}]`.trim(),
    });
    setModalType(null);
  };

  const handleCancelMembership = () => {
    updateMembership({
      hasMembership: false,
      notes: `${client.membership?.notes || ''}\n[Cancelled on ${new Date().toLocaleDateString()}${cancelReason ? `: ${cancelReason}` : ''}]`.trim(),
    });
    setModalType(null);
    setCancelReason('');
  };

  // Mock membership history - in production would come from DB
  const membershipHistory = [
    { date: '2024-01-15', action: 'Activated', plan: 'Standard', amount: 99 },
    { date: '2024-02-15', action: 'Renewed', plan: 'Standard', amount: 99 },
    { date: '2024-03-15', action: 'Renewed', plan: 'Standard', amount: 99 },
  ];

  return (
    <div className="space-y-6">
      {/* Membership Status */}
      <MembershipStatusCard
        membership={client.membership}
        onActivate={() => setModalType('activate')}
        onRenew={() => setModalType('renew')}
        onFreeze={() => setModalType('freeze')}
        onCancel={() => setModalType('cancel')}
      />

      {/* Membership Settings (only show if has membership) */}
      {client.membership?.hasMembership && (
        <Card title="Membership Settings" description="Manage membership details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Membership Type"
              value={client.membership?.membershipType || ''}
              onChange={(v) => updateMembership({ membershipType: v })}
            />
            <Input
              label="Monthly Price"
              value={String(client.membership?.membershipPrice || '')}
              onChange={(v) => updateMembership({ membershipPrice: parseFloat(v) || 0 })}
              type="number"
            />
            <Input
              label="Start Date"
              value={client.membership?.membershipStartDate || ''}
              onChange={(v) => updateMembership({ membershipStartDate: v })}
              type="date"
            />
            <Input
              label="End Date"
              value={client.membership?.membershipEndDate || ''}
              onChange={(v) => updateMembership({ membershipEndDate: v })}
              type="date"
            />
            <Input
              label="Monthly Credits"
              value={String(client.membership?.monthlyCredits || '')}
              onChange={(v) => updateMembership({ monthlyCredits: parseInt(v) || 0 })}
              type="number"
            />
            <Input
              label="Credits Remaining"
              value={String(client.membership?.creditsRemaining || '')}
              onChange={(v) => updateMembership({ creditsRemaining: parseInt(v) || 0 })}
              type="number"
            />
            <div className="md:col-span-2">
              <Toggle
                label="Auto-Renew"
                description="Automatically renew membership at end of billing period"
                checked={client.membership?.autoRenew || false}
                onChange={(v) => updateMembership({ autoRenew: v })}
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <Input
              label="Notes"
              value={client.membership?.notes || ''}
              onChange={(v) => updateMembership({ notes: v })}
              placeholder="Additional notes about this membership"
            />
          </div>
        </Card>
      )}

      {/* Membership History */}
      {client.membership?.hasMembership && (
        <Card title="Membership History" description="Past transactions and activity">
          <div className="divide-y divide-gray-100">
            {membershipHistory.map((item, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.action === 'Activated' ? 'bg-green-100' :
                    item.action === 'Renewed' ? 'bg-cyan-100' :
                    item.action === 'Cancelled' ? 'bg-red-100' :
                    'bg-gray-100'
                  }`}>
                    {item.action === 'Activated' && <CheckIcon className="w-4 h-4 text-green-600" />}
                    {item.action === 'Renewed' && <RefreshIcon className="w-4 h-4 text-cyan-600" />}
                    {item.action === 'Cancelled' && <XIcon className="w-4 h-4 text-red-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.action}</p>
                    <p className="text-xs text-gray-500">{item.plan} Plan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${item.amount}</p>
                  <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Activate Membership Modal */}
      {modalType === 'activate' && (
        <Modal title="Start Membership" onClose={() => setModalType(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Choose a membership plan for {client.firstName} {client.lastName}
            </p>

            {/* Plan Selection */}
            <div className="space-y-3">
              {MEMBERSHIP_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedPlan === plan.id
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{plan.name}</p>
                      <p className="text-xs text-gray-500">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      {plan.id !== 'custom' && (
                        <>
                          <p className="text-lg font-bold text-gray-900">${plan.price}</p>
                          <p className="text-xs text-gray-500">{plan.credits} credits/mo</p>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Plan Fields */}
            {selectedPlan === 'custom' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <Input
                  label="Plan Name"
                  value={customMembership.membershipType || ''}
                  onChange={(v) => setCustomMembership(prev => ({ ...prev, membershipType: v }))}
                  placeholder="e.g., Color Club VIP"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Monthly Price"
                    value={String(customMembership.membershipPrice || '')}
                    onChange={(v) => setCustomMembership(prev => ({ ...prev, membershipPrice: parseFloat(v) || 0 }))}
                    type="number"
                  />
                  <Input
                    label="Monthly Credits"
                    value={String(customMembership.monthlyCredits || '')}
                    onChange={(v) => setCustomMembership(prev => ({ ...prev, monthlyCredits: parseInt(v) || 0 }))}
                    type="number"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setModalType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleActivateMembership}>
                Activate Membership
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Renew Membership Modal */}
      {modalType === 'renew' && (
        <Modal title="Renew Membership" onClose={() => setModalType(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Renew {client.firstName}'s {client.membership?.membershipType} membership for another month?
            </p>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium">{client.membership?.membershipType}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium">${client.membership?.membershipPrice}/month</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-600">Credits</span>
                <span className="font-medium">{client.membership?.monthlyCredits} credits</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setModalType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleRenewMembership}>
                Renew Now
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Freeze Membership Modal */}
      {modalType === 'freeze' && (
        <Modal title="Freeze Membership" onClose={() => setModalType(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Freeze {client.firstName}'s membership? The end date will be extended by the freeze duration.
            </p>

            <Select
              label="Freeze Duration"
              value={String(freezeDuration)}
              onChange={(v) => setFreezeDuration(parseInt(v))}
              options={[
                { value: '7', label: '1 Week' },
                { value: '14', label: '2 Weeks' },
                { value: '30', label: '1 Month' },
                { value: '60', label: '2 Months' },
                { value: '90', label: '3 Months' },
              ]}
            />

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                New end date will be:{' '}
                <strong>
                  {(() => {
                    const date = client.membership?.membershipEndDate
                      ? new Date(client.membership.membershipEndDate)
                      : new Date();
                    date.setDate(date.getDate() + freezeDuration);
                    return date.toLocaleDateString();
                  })()}
                </strong>
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setModalType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleFreezeMembership}>
                Freeze Membership
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Membership Modal */}
      {modalType === 'cancel' && (
        <Modal title="Cancel Membership" onClose={() => setModalType(null)}>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                Are you sure you want to cancel {client.firstName}'s membership?
                This action cannot be undone.
              </p>
            </div>

            <Textarea
              label="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={setCancelReason}
              placeholder="Enter reason..."
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setModalType(null)}>Keep Membership</Button>
              <Button variant="outline" onClick={handleCancelMembership} className="text-red-600 border-red-300 hover:bg-red-50">
                Cancel Membership
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Simple Modal Component
const Modal: React.FC<{
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/50" onClick={onClose} />
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  </div>
);

// Icons
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default MembershipSection;
