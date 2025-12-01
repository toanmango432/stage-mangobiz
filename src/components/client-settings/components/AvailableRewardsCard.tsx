import React from 'react';
import type { LoyaltyReward } from '../../../types';
import { Card, Badge, Button } from './SharedComponents';

interface AvailableRewardsCardProps {
  rewards: LoyaltyReward[];
  pointsBalance: number;
  onRedeemReward: (reward: LoyaltyReward) => void;
}

// Sample reward catalog - in production would come from config/API
const REWARD_CATALOG = [
  { id: 'r1', name: '$5 Off Next Service', pointsCost: 250, type: 'amount_discount' as const, value: 5 },
  { id: 'r2', name: '$10 Off Next Service', pointsCost: 500, type: 'amount_discount' as const, value: 10 },
  { id: 'r3', name: '15% Off Next Service', pointsCost: 750, type: 'percentage_discount' as const, value: 15 },
  { id: 'r4', name: 'Free Blowout', pointsCost: 1000, type: 'free_service' as const, value: 35, serviceId: 'blowout' },
  { id: 'r5', name: 'Free Mini Facial', pointsCost: 1500, type: 'free_service' as const, value: 50, serviceId: 'mini-facial' },
  { id: 'r6', name: 'Free Retail Product (up to $25)', pointsCost: 2000, type: 'free_product' as const, value: 25 },
];

export const AvailableRewardsCard: React.FC<AvailableRewardsCardProps> = ({
  rewards,
  pointsBalance,
  onRedeemReward,
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRewardTypeLabel = (type: LoyaltyReward['type']) => {
    switch (type) {
      case 'amount_discount': return 'Discount';
      case 'percentage_discount': return '% Off';
      case 'free_service': return 'Free Service';
      case 'free_product': return 'Free Product';
      default: return 'Reward';
    }
  };

  const getRewardIcon = (type: LoyaltyReward['type']) => {
    switch (type) {
      case 'amount_discount':
      case 'percentage_discount':
        return <DollarIcon className="w-5 h-5" />;
      case 'free_service':
        return <SparklesIcon className="w-5 h-5" />;
      case 'free_product':
        return <GiftIcon className="w-5 h-5" />;
      default:
        return <StarIcon className="w-5 h-5" />;
    }
  };

  // Active (unredeemed) rewards
  const activeRewards = rewards.filter(r => !r.redeemedAt);
  const hasExpiring = activeRewards.some(r => {
    if (!r.expiresAt) return false;
    const daysUntil = Math.ceil((new Date(r.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 14;
  });

  return (
    <Card
      title="Available Rewards"
      description={`${pointsBalance.toLocaleString()} points available`}
    >
      {/* Expiring Warning */}
      {hasExpiring && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
          <ClockIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-800">Rewards Expiring Soon</p>
            <p className="text-xs text-orange-600 mt-1">
              Some rewards will expire within 14 days. Use them before they're gone!
            </p>
          </div>
        </div>
      )}

      {/* Active Rewards (Earned but not redeemed) */}
      {activeRewards.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Your Rewards</h4>
          <div className="space-y-2">
            {activeRewards.map((reward) => {
              const isExpiring = reward.expiresAt && Math.ceil(
                (new Date(reward.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              ) <= 14;

              return (
                <div
                  key={reward.id}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border
                    ${isExpiring ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isExpiring ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}
                    `}>
                      {getRewardIcon(reward.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {reward.type === 'amount_discount' && `$${reward.value} Off`}
                        {reward.type === 'percentage_discount' && `${reward.value}% Off`}
                        {reward.type === 'free_service' && 'Free Service'}
                        {reward.type === 'free_product' && 'Free Product'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge size="sm" variant={reward.earnedFrom === 'referral' ? 'info' : 'default'}>
                          {reward.earnedFrom}
                        </Badge>
                        {reward.expiresAt && (
                          <span className={isExpiring ? 'text-orange-600' : ''}>
                            Expires {formatDate(reward.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => onRedeemReward(reward)}>
                    Use Now
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reward Catalog */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Redeem Points for Rewards
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {REWARD_CATALOG.map((catalogReward) => {
            const canAfford = pointsBalance >= catalogReward.pointsCost;

            return (
              <div
                key={catalogReward.id}
                className={`
                  p-4 rounded-lg border transition-all
                  ${canAfford
                    ? 'border-gray-200 bg-white hover:border-cyan-300 hover:shadow-sm cursor-pointer'
                    : 'border-gray-100 bg-gray-50 opacity-60'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${canAfford ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-400'}
                    `}>
                      {getRewardIcon(catalogReward.type)}
                    </div>
                    <div>
                      <p className={`font-medium ${canAfford ? 'text-gray-900' : 'text-gray-500'}`}>
                        {catalogReward.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getRewardTypeLabel(catalogReward.type)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <StarIcon className={`w-4 h-4 ${canAfford ? 'text-cyan-500' : 'text-gray-300'}`} />
                    <span className={`font-bold ${canAfford ? 'text-cyan-600' : 'text-gray-400'}`}>
                      {catalogReward.pointsCost.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">pts</span>
                  </div>
                  {canAfford ? (
                    <button className="text-xs font-medium text-cyan-600 hover:text-cyan-700">
                      Redeem
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Need {(catalogReward.pointsCost - pointsBalance).toLocaleString()} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {activeRewards.length === 0 && pointsBalance === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg mt-4">
          <StarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No points yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Earn points with every visit to unlock rewards!
          </p>
        </div>
      )}
    </Card>
  );
};

// Icons
const DollarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const GiftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default AvailableRewardsCard;
