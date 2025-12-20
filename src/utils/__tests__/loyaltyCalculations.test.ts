/**
 * Loyalty Calculations Tests
 * Tests for loyalty points earning, redemption, and tier evaluation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateLoyaltyEarnings,
  buildUpdatedLoyaltyInfo,
  buildLoyaltyInfoAfterRedemption,
  canRedeemPoints,
  formatPoints,
  getTierDisplay,
  calculateTierProgress,
} from '../loyaltyCalculations';
import {
  getTierConfig,
  getTierBySpend,
  calculatePointsEarned,
  calculatePointsValue,
  calculatePointsNeeded,
  DEFAULT_LOYALTY_SETTINGS,
} from '../../constants/loyaltyConfig';
import type { Client } from '../../types/client';
import type { LoyaltySettings } from '../../types/loyalty';

// Mock client factory
const createMockClient = (overrides: Partial<Client> = {}): Client => ({
  id: 'client-1',
  firstName: 'John',
  lastName: 'Doe',
  phone: '1234567890',
  email: 'john@example.com',
  memberSince: '2024-01-01',
  status: 'active',
  loyaltyInfo: {
    tier: 'bronze',
    pointsBalance: 0,
    lifetimePoints: 0,
    memberSince: '2024-01-01',
    referralCount: 0,
    rewardsRedeemed: 0,
  },
  visitSummary: {
    totalVisits: 0,
    totalSpent: 0,
    averageSpend: 0,
    lastVisit: '2024-01-01',
    noShowCount: 0,
  },
  ...overrides,
});

describe('loyaltyConfig utilities', () => {
  describe('getTierConfig', () => {
    it('should return bronze tier config by default', () => {
      const config = getTierConfig('bronze');
      expect(config.tier).toBe('bronze');
      expect(config.minSpend).toBe(0);
      expect(config.pointsMultiplier).toBe(1.0);
    });

    it('should return correct config for each tier', () => {
      expect(getTierConfig('silver').pointsMultiplier).toBe(1.25);
      expect(getTierConfig('gold').pointsMultiplier).toBe(1.5);
      expect(getTierConfig('platinum').pointsMultiplier).toBe(2.0);
      expect(getTierConfig('vip').pointsMultiplier).toBe(2.5);
    });

    it('should return bronze for unknown tier', () => {
      const config = getTierConfig('unknown' as any);
      expect(config.tier).toBe('bronze');
    });
  });

  describe('getTierBySpend', () => {
    it('should return bronze for low spend', () => {
      expect(getTierBySpend(0)).toBe('bronze');
      expect(getTierBySpend(499)).toBe('bronze');
    });

    it('should return silver for $500+ spend', () => {
      expect(getTierBySpend(500)).toBe('silver');
      expect(getTierBySpend(1499)).toBe('silver');
    });

    it('should return gold for $1500+ spend', () => {
      expect(getTierBySpend(1500)).toBe('gold');
      expect(getTierBySpend(4999)).toBe('gold');
    });

    it('should return platinum for $5000+ spend', () => {
      expect(getTierBySpend(5000)).toBe('platinum');
      expect(getTierBySpend(9999)).toBe('platinum');
    });

    it('should return vip for $10000+ spend', () => {
      expect(getTierBySpend(10000)).toBe('vip');
      expect(getTierBySpend(50000)).toBe('vip');
    });
  });

  describe('calculatePointsEarned', () => {
    it('should calculate base points for bronze tier', () => {
      expect(calculatePointsEarned(100, 'bronze')).toBe(100);
    });

    it('should apply tier multiplier', () => {
      expect(calculatePointsEarned(100, 'silver')).toBe(125); // 100 * 1.25
      expect(calculatePointsEarned(100, 'gold')).toBe(150);   // 100 * 1.5
      expect(calculatePointsEarned(100, 'platinum')).toBe(200); // 100 * 2.0
      expect(calculatePointsEarned(100, 'vip')).toBe(250);    // 100 * 2.5
    });

    it('should round down to whole points', () => {
      expect(calculatePointsEarned(33, 'silver')).toBe(41); // 33 * 1.25 = 41.25 -> 41
    });
  });

  describe('calculatePointsValue', () => {
    it('should convert points to dollar value', () => {
      expect(calculatePointsValue(100)).toBe(1);   // 100 points = $1
      expect(calculatePointsValue(250)).toBe(2.5); // 250 points = $2.50
    });
  });

  describe('calculatePointsNeeded', () => {
    it('should convert dollar discount to points needed', () => {
      expect(calculatePointsNeeded(1)).toBe(100);  // $1 = 100 points
      expect(calculatePointsNeeded(10)).toBe(1000); // $10 = 1000 points
    });

    it('should round up', () => {
      expect(calculatePointsNeeded(1.5)).toBe(150); // $1.50 = 150 points
    });
  });
});

describe('loyaltyCalculations utilities', () => {
  describe('calculateLoyaltyEarnings', () => {
    it('should calculate earnings for bronze tier', () => {
      const client = createMockClient();
      const input = { servicesTotal: 100, productsTotal: 0, subtotal: 100 };

      const result = calculateLoyaltyEarnings(client, input);

      expect(result.pointsEarned).toBe(100);
      expect(result.tierMultiplier).toBe(1);
      expect(result.eligibleAmount).toBe(100);
      expect(result.tierChanged).toBe(false);
    });

    it('should include products if enabled', () => {
      const client = createMockClient();
      const input = { servicesTotal: 50, productsTotal: 50, subtotal: 100 };

      const result = calculateLoyaltyEarnings(client, input);

      expect(result.eligibleAmount).toBe(100);
      expect(result.pointsEarned).toBe(100);
    });

    it('should return zero if loyalty is disabled', () => {
      const client = createMockClient();
      const input = { servicesTotal: 100, productsTotal: 0, subtotal: 100 };
      const settings: LoyaltySettings = { ...DEFAULT_LOYALTY_SETTINGS, enabled: false };

      const result = calculateLoyaltyEarnings(client, input, settings);

      expect(result.pointsEarned).toBe(0);
    });

    it('should return zero if client is excluded', () => {
      const client = createMockClient({
        loyaltyInfo: {
          tier: 'bronze',
          pointsBalance: 100,
          lifetimePoints: 100,
          memberSince: '2024-01-01',
          referralCount: 0,
          rewardsRedeemed: 0,
          excludeFromLoyalty: true,
        },
      });
      const input = { servicesTotal: 100, productsTotal: 0, subtotal: 100 };

      const result = calculateLoyaltyEarnings(client, input);

      expect(result.pointsEarned).toBe(0);
    });

    it('should detect tier change', () => {
      const client = createMockClient({
        visitSummary: {
          totalVisits: 5,
          totalSpent: 480, // Just under silver threshold
          averageSpend: 96,
          lastVisit: '2024-01-01',
          noShowCount: 0,
        },
      });
      const input = { servicesTotal: 30, productsTotal: 0, subtotal: 30 };

      const result = calculateLoyaltyEarnings(client, input);

      expect(result.tierChanged).toBe(true);
      expect(result.newTier).toBe('silver');
      expect(result.previousTier).toBe('bronze');
    });
  });

  describe('buildUpdatedLoyaltyInfo', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should update points balance', () => {
      const currentInfo = {
        tier: 'bronze' as const,
        pointsBalance: 100,
        lifetimePoints: 100,
        memberSince: '2024-01-01',
        referralCount: 0,
        rewardsRedeemed: 0,
      };
      const result = {
        pointsEarned: 50,
        tierMultiplier: 1,
        eligibleAmount: 50,
        newTotalPoints: 150,
        newLifetimePoints: 150,
        tierChanged: false,
      };

      const updated = buildUpdatedLoyaltyInfo(currentInfo, result);

      expect(updated.pointsBalance).toBe(150);
      expect(updated.lifetimePoints).toBe(150);
      expect(updated.tier).toBe('bronze');
    });

    it('should update tier when changed', () => {
      const currentInfo = {
        tier: 'bronze' as const,
        pointsBalance: 100,
        lifetimePoints: 100,
        memberSince: '2024-01-01',
        referralCount: 0,
        rewardsRedeemed: 0,
      };
      const result = {
        pointsEarned: 50,
        tierMultiplier: 1,
        eligibleAmount: 50,
        newTotalPoints: 150,
        newLifetimePoints: 150,
        tierChanged: true,
        newTier: 'silver' as const,
        previousTier: 'bronze' as const,
      };

      const updated = buildUpdatedLoyaltyInfo(currentInfo, result);

      expect(updated.tier).toBe('silver');
      expect(updated.lastTierUpdate).toContain('2024-06-15'); // Check date, ignore exact time due to timezone
    });
  });

  describe('buildLoyaltyInfoAfterRedemption', () => {
    it('should deduct points after redemption', () => {
      const currentInfo = {
        tier: 'gold' as const,
        pointsBalance: 500,
        lifetimePoints: 1000,
        memberSince: '2024-01-01',
        referralCount: 0,
        rewardsRedeemed: 2,
      };

      const updated = buildLoyaltyInfoAfterRedemption(currentInfo, 200);

      expect(updated.pointsBalance).toBe(300);
      expect(updated.rewardsRedeemed).toBe(3);
      expect(updated.lifetimePoints).toBe(1000); // Unchanged
    });

    it('should not go below zero', () => {
      const currentInfo = {
        tier: 'bronze' as const,
        pointsBalance: 50,
        lifetimePoints: 50,
        memberSince: '2024-01-01',
        referralCount: 0,
        rewardsRedeemed: 0,
      };

      const updated = buildLoyaltyInfoAfterRedemption(currentInfo, 100);

      expect(updated.pointsBalance).toBe(0);
    });
  });

  describe('canRedeemPoints', () => {
    it('should allow redemption with sufficient points', () => {
      const client = createMockClient({
        loyaltyInfo: {
          tier: 'bronze',
          pointsBalance: 500,
          lifetimePoints: 500,
          memberSince: '2024-01-01',
          referralCount: 0,
          rewardsRedeemed: 0,
        },
      });

      const result = canRedeemPoints(client, 200);

      expect(result.canRedeem).toBe(true);
    });

    it('should reject if loyalty is disabled', () => {
      const client = createMockClient();
      const settings: LoyaltySettings = { ...DEFAULT_LOYALTY_SETTINGS, enabled: false };

      const result = canRedeemPoints(client, 100, settings);

      expect(result.canRedeem).toBe(false);
      expect(result.reason).toContain('disabled');
    });

    it('should reject if client is excluded', () => {
      const client = createMockClient({
        loyaltyInfo: {
          tier: 'bronze',
          pointsBalance: 500,
          lifetimePoints: 500,
          memberSince: '2024-01-01',
          referralCount: 0,
          rewardsRedeemed: 0,
          excludeFromLoyalty: true,
        },
      });

      const result = canRedeemPoints(client, 100);

      expect(result.canRedeem).toBe(false);
      expect(result.reason).toContain('excluded');
    });

    it('should reject if insufficient points', () => {
      const client = createMockClient({
        loyaltyInfo: {
          tier: 'bronze',
          pointsBalance: 50,
          lifetimePoints: 50,
          memberSince: '2024-01-01',
          referralCount: 0,
          rewardsRedeemed: 0,
        },
      });

      const result = canRedeemPoints(client, 100);

      expect(result.canRedeem).toBe(false);
      expect(result.reason).toContain('Insufficient');
    });

    it('should reject if below minimum redemption', () => {
      const client = createMockClient({
        loyaltyInfo: {
          tier: 'bronze',
          pointsBalance: 500,
          lifetimePoints: 500,
          memberSince: '2024-01-01',
          referralCount: 0,
          rewardsRedeemed: 0,
        },
      });

      const result = canRedeemPoints(client, 50); // Below 100 minimum

      expect(result.canRedeem).toBe(false);
      expect(result.reason).toContain('Minimum');
    });
  });

  describe('formatPoints', () => {
    it('should format points with locale separator', () => {
      expect(formatPoints(1000)).toBe('1,000');
      expect(formatPoints(1000000)).toBe('1,000,000');
    });

    it('should handle small numbers', () => {
      expect(formatPoints(100)).toBe('100');
      expect(formatPoints(0)).toBe('0');
    });
  });

  describe('getTierDisplay', () => {
    it('should return display info for each tier', () => {
      expect(getTierDisplay('bronze').name).toBe('Bronze');
      expect(getTierDisplay('silver').name).toBe('Silver');
      expect(getTierDisplay('gold').name).toBe('Gold');
      expect(getTierDisplay('platinum').name).toBe('Platinum');
      expect(getTierDisplay('vip').name).toBe('VIP');
    });

    it('should include color class', () => {
      const display = getTierDisplay('gold');
      expect(display.color).toContain('yellow');
    });
  });

  describe('calculateTierProgress', () => {
    it('should calculate progress to next tier', () => {
      const progress = calculateTierProgress(250, 'bronze');

      expect(progress.nextTier).toBe('silver');
      expect(progress.amountNeeded).toBe(250); // 500 - 250
      expect(progress.percentProgress).toBe(50); // 250/500 = 50%
    });

    it('should return 100% for highest tier', () => {
      const progress = calculateTierProgress(15000, 'vip');

      expect(progress.nextTier).toBeNull();
      expect(progress.amountNeeded).toBe(0);
      expect(progress.percentProgress).toBe(100);
    });

    it('should handle edge case at tier threshold', () => {
      const progress = calculateTierProgress(500, 'silver');

      expect(progress.nextTier).toBe('gold');
      expect(progress.percentProgress).toBe(0);
    });
  });
});
