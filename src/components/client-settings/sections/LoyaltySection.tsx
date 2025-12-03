import React, { useState } from 'react';
import type { EnhancedClient, LoyaltyTier } from '../types';
import type { LoyaltyReward } from '../../../types';
import { tierLabels, clientSettingsTokens } from '../constants';
import { Card, Select, Toggle, Input, Button } from '../components/SharedComponents';
import { ReferralTrackingCard } from '../components/ReferralTrackingCard';
import { ClientReviewsCard } from '../components/ClientReviewsCard';
import { PointsAdjustmentModal } from '../components/PointsAdjustmentModal';
import { AvailableRewardsCard } from '../components/AvailableRewardsCard';

interface LoyaltySectionProps {
  client: EnhancedClient;
  onChange: (updates: Partial<EnhancedClient>) => void;
}

export const LoyaltySection: React.FC<LoyaltySectionProps> = ({ client, onChange }) => {
  const [showPointsModal, setShowPointsModal] = useState<'add' | 'redeem' | null>(null);

  const updateLoyaltyInfo = (field: string, value: any) => {
    onChange({
      loyaltyInfo: { ...client.loyaltyInfo, [field]: value },
    });
  };

  const updateMembership = (field: string, value: any) => {
    onChange({
      membership: {
        hasMembership: client.membership?.hasMembership || false,
        ...client.membership,
        [field]: value
      },
    });
  };

  const getTierBadgeStyle = (tier: LoyaltyTier) => {
    const colors = clientSettingsTokens.tierColors[tier];
    return {
      backgroundColor: colors.bg,
      color: colors.text,
      borderColor: colors.border,
    };
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const tierOptions = Object.entries(tierLabels).map(([value, label]) => ({
    value,
    label,
  }));

  // Calculate progress to next tier
  const getTierProgress = () => {
    const tierThresholds: Record<LoyaltyTier, number> = {
      bronze: 0,
      silver: 1000,
      gold: 3000,
      platinum: 7500,
      vip: 15000,
    };

    const tierOrder: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'vip'];
    const currentTierIndex = tierOrder.indexOf(client.loyaltyInfo.tier);

    if (currentTierIndex === tierOrder.length - 1) {
      return { nextTier: null, progress: 100, pointsNeeded: 0 };
    }

    const nextTier = tierOrder[currentTierIndex + 1];
    const nextThreshold = tierThresholds[nextTier];
    const currentThreshold = tierThresholds[client.loyaltyInfo.tier];
    const pointsInRange = client.loyaltyInfo.lifetimePoints - currentThreshold;
    const rangeSize = nextThreshold - currentThreshold;
    const progress = Math.min(100, Math.floor((pointsInRange / rangeSize) * 100));
    const pointsNeeded = Math.max(0, nextThreshold - client.loyaltyInfo.lifetimePoints);

    return { nextTier, progress, pointsNeeded };
  };

  const handlePointsAdjustment = (amount: number) => {
    const newBalance = showPointsModal === 'add'
      ? client.loyaltyInfo.pointsBalance + amount
      : client.loyaltyInfo.pointsBalance - amount;

    const newLifetimePoints = showPointsModal === 'add'
      ? client.loyaltyInfo.lifetimePoints + amount
      : client.loyaltyInfo.lifetimePoints;

    onChange({
      loyaltyInfo: {
        ...client.loyaltyInfo,
        pointsBalance: Math.max(0, newBalance),
        lifetimePoints: newLifetimePoints,
        rewardsRedeemed: showPointsModal === 'redeem'
          ? client.loyaltyInfo.rewardsRedeemed + 1
          : client.loyaltyInfo.rewardsRedeemed,
      },
    });
    setShowPointsModal(null);
  };

  const handleRedeemReward = (reward: LoyaltyReward) => {
    if (client.loyaltyInfo.pointsBalance >= (reward.pointsCost ?? 0)) {
      onChange({
        loyaltyInfo: {
          ...client.loyaltyInfo,
          pointsBalance: client.loyaltyInfo.pointsBalance - (reward.pointsCost ?? 0),
          rewardsRedeemed: client.loyaltyInfo.rewardsRedeemed + 1,
        },
      });
    }
  };

  const handleGenerateReferralCode = () => {
    const code = `REF${client.id.slice(0, 4).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    updateLoyaltyInfo('referralCode', code);
  };

  const tierProgress = getTierProgress();

  // Mock client rewards - in production would come from DB
  const clientRewards: LoyaltyReward[] = [];

  return (
    <div className="space-y-6">
      {/* Loyalty Status Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className="text-lg font-bold px-4 py-1 rounded-full border-2"
                style={getTierBadgeStyle(client.loyaltyInfo.tier)}
              >
                {tierLabels[client.loyaltyInfo.tier]}
              </span>
              <span className="text-sm text-gray-500">Member</span>
            </div>
            <p className="text-sm text-gray-600">
              Member since {formatDate(client.loyaltyInfo.memberSince)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-cyan-600">
              {client.loyaltyInfo.pointsBalance.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Available Points</p>
          </div>
        </div>

        {/* Progress to next tier */}
        {tierProgress.nextTier && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress to {tierLabels[tierProgress.nextTier]}
              </span>
              <span className="text-sm text-gray-500">
                {tierProgress.pointsNeeded.toLocaleString()} points to go
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full transition-all duration-500"
                style={{ width: `${tierProgress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {client.loyaltyInfo.lifetimePoints.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Lifetime Points</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {client.loyaltyInfo.referralCount}
            </p>
            <p className="text-xs text-gray-500">Referrals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {client.loyaltyInfo.rewardsRedeemed}
            </p>
            <p className="text-xs text-gray-500">Rewards Used</p>
          </div>
        </div>
      </Card>

      {/* Points Management */}
      <Card title="Points Management" description="Add or redeem loyalty points">
        <div className="flex items-center gap-4">
          <Button variant="primary" onClick={() => setShowPointsModal('add')}>
            <GiftIcon className="w-4 h-4" />
            Add Points
          </Button>
          <Button variant="outline" onClick={() => setShowPointsModal('redeem')}>
            <MinusIcon className="w-4 h-4" />
            Redeem Points
          </Button>
        </div>
      </Card>

      {/* Available Rewards */}
      <AvailableRewardsCard
        rewards={clientRewards}
        pointsBalance={client.loyaltyInfo.pointsBalance}
        onRedeemReward={handleRedeemReward}
      />

      {/* Referral Tracking */}
      <ReferralTrackingCard
        clientId={client.id}
        referralCode={client.loyaltyInfo.referralCode}
        referralCount={client.loyaltyInfo.referralCount}
        onGenerateCode={handleGenerateReferralCode}
        onCopyCode={(code) => navigator.clipboard.writeText(code)}
      />

      {/* Client Reviews */}
      <ClientReviewsCard
        clientId={client.id}
        averageRating={4.5}
        totalReviews={client.visitSummary.totalVisits > 0 ? Math.floor(client.visitSummary.totalVisits * 0.3) : 0}
        onRequestReview={() => alert('Review request sent!')}
      />

      {/* Loyalty Settings */}
      <Card title="Loyalty Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Loyalty Tier"
            value={client.loyaltyInfo.tier}
            onChange={(v) => updateLoyaltyInfo('tier', v)}
            options={tierOptions}
          />

          <Input
            label="Points Balance"
            value={String(client.loyaltyInfo.pointsBalance)}
            onChange={(v) => updateLoyaltyInfo('pointsBalance', parseInt(v) || 0)}
            type="number"
          />

          <Input
            label="Referral Code"
            value={client.loyaltyInfo.referralCode || ''}
            onChange={(v) => updateLoyaltyInfo('referralCode', v)}
            placeholder="Auto-generated"
          />

          <Input
            label="Referred By"
            value={client.loyaltyInfo.referredBy || ''}
            onChange={(v) => updateLoyaltyInfo('referredBy', v)}
            placeholder="Referrer's code"
          />
        </div>
      </Card>

      {/* Membership */}
      <Card title="Membership Program" description="Subscription-based membership benefits">
        <Toggle
          label="Has Active Membership"
          description="Enable if client has a membership subscription"
          checked={client.membership?.hasMembership || false}
          onChange={(v) => updateMembership('hasMembership', v)}
        />

        {client.membership?.hasMembership && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
            <Input
              label="Membership Type"
              value={client.membership?.membershipType || ''}
              onChange={(v) => updateMembership('membershipType', v)}
              placeholder="e.g., Premium Color Club"
            />

            <Input
              label="Monthly Price"
              value={String(client.membership?.membershipPrice || '')}
              onChange={(v) => updateMembership('membershipPrice', parseFloat(v) || 0)}
              type="number"
            />

            <Input
              label="Start Date"
              value={client.membership?.membershipStartDate || ''}
              onChange={(v) => updateMembership('membershipStartDate', v)}
              type="date"
            />

            <Input
              label="End Date"
              value={client.membership?.membershipEndDate || ''}
              onChange={(v) => updateMembership('membershipEndDate', v)}
              type="date"
            />

            <Input
              label="Monthly Credits"
              value={String(client.membership?.monthlyCredits || '')}
              onChange={(v) => updateMembership('monthlyCredits', parseInt(v) || 0)}
              type="number"
            />

            <Input
              label="Credits Remaining"
              value={String(client.membership?.creditsRemaining || '')}
              onChange={(v) => updateMembership('creditsRemaining', parseInt(v) || 0)}
              type="number"
            />

            <div className="md:col-span-2">
              <Toggle
                label="Auto-Renew"
                description="Automatically renew membership at end of period"
                checked={client.membership?.autoRenew || false}
                onChange={(v) => updateMembership('autoRenew', v)}
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Notes"
                value={client.membership?.notes || ''}
                onChange={(v) => updateMembership('notes', v)}
                placeholder="Additional membership notes"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Points Adjustment Modal */}
      {showPointsModal && (
        <PointsAdjustmentModal
          clientName={`${client.firstName} ${client.lastName}`}
          currentBalance={client.loyaltyInfo.pointsBalance}
          type={showPointsModal}
          onAdjust={handlePointsAdjustment}
          onClose={() => setShowPointsModal(null)}
        />
      )}
    </div>
  );
};

// Icons
const GiftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const MinusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

export default LoyaltySection;
