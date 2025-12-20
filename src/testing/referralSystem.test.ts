/**
 * Referral System Backend Tests
 * Tests referral config, utilities, and database operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { referralsDB, clientsDB } from '../db/database';
import { db } from '../db/schema';
import {
  generateReferralCode,
  calculateReferrerReward,
  calculateReferredDiscount,
  isReferralExpired,
  isValidReferralCode,
  generateShareMessage,
  generateReferralLink,
  DEFAULT_REFERRAL_SETTINGS,
} from '../constants/referralConfig';
import type { Client } from '../types/client';

describe('Referral System Backend Tests', () => {
  const testStoreId = 'test-store-referral';
  let testReferrer: Client;
  let testReferred: Client;
  let createdReferralId: string;

  beforeAll(async () => {
    await db.open();

    // Create test referrer client
    testReferrer = await clientsDB.create({
      salonId: testStoreId,
      firstName: 'John',
      lastName: 'Referrer',
      name: 'John Referrer',
      phone: '555-0001',
      email: 'john@test.com',
      isBlocked: false,
      isVip: false,
      loyaltyInfo: {
        tier: 'bronze',
        pointsBalance: 100,
        lifetimePoints: 100,
        referralCount: 0,
        rewardsRedeemed: 0,
        referralCode: 'REFJOHN1',
      },
    });

    // Create test referred client
    testReferred = await clientsDB.create({
      salonId: testStoreId,
      firstName: 'Jane',
      lastName: 'Referred',
      name: 'Jane Referred',
      phone: '555-0002',
      email: 'jane@test.com',
      isBlocked: false,
      isVip: false,
    });
  });

  afterAll(async () => {
    // Cleanup
    if (createdReferralId) {
      await db.referrals.delete(createdReferralId);
    }
    if (testReferrer?.id) {
      await db.clients.delete(testReferrer.id);
    }
    if (testReferred?.id) {
      await db.clients.delete(testReferred.id);
    }
  });

  describe('Referral Code Generation', () => {
    it('should generate alphanumeric code with correct length', () => {
      const code = generateReferralCode('alphanumeric', 6);
      expect(code.length).toBe(6);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });

    it('should generate code with prefix', () => {
      const code = generateReferralCode('alphanumeric', 6, 'REF');
      expect(code.startsWith('REF')).toBe(true);
      expect(code.length).toBe(9); // 3 prefix + 6 code
    });

    it('should generate numeric code', () => {
      const code = generateReferralCode('numeric', 8);
      expect(code.length).toBe(8);
      expect(/^[0-9]+$/.test(code)).toBe(true);
    });

    it('should generate name-based code', () => {
      const code = generateReferralCode('name_based', 6, undefined, 'Alice');
      expect(code.startsWith('ALI')).toBe(true);
      expect(code.length).toBe(6);
    });

    it('should handle short names in name-based codes', () => {
      const code = generateReferralCode('name_based', 6, undefined, 'Jo');
      expect(code.length).toBe(6);
    });
  });

  describe('Referral Reward Calculations', () => {
    it('should calculate default referrer reward', () => {
      const reward = calculateReferrerReward();
      expect(reward.amount).toBe(25);
      expect(reward.type).toBe('credit');
    });

    it('should calculate custom referrer reward', () => {
      const reward = calculateReferrerReward({
        ...DEFAULT_REFERRAL_SETTINGS,
        referrerRewardAmount: 50,
        referrerRewardType: 'points',
        referrerRewardPoints: 5000,
      });
      expect(reward.amount).toBe(50);
      expect(reward.type).toBe('points');
      expect(reward.points).toBe(5000);
    });

    it('should calculate referred client discount', () => {
      const discount = calculateReferredDiscount(100);
      expect(discount.discountPercent).toBe(15);
      expect(discount.discountAmount).toBe(15);
      expect(discount.finalAmount).toBe(85);
    });

    it('should apply max discount cap', () => {
      const discount = calculateReferredDiscount(500, {
        ...DEFAULT_REFERRAL_SETTINGS,
        referredMaxDiscount: 50,
      });
      // 500 * 15% = 75, but max is 50
      expect(discount.discountAmount).toBe(50);
      expect(discount.finalAmount).toBe(450);
    });
  });

  describe('Referral Expiration', () => {
    it('should not expire when expirationDays is 0', () => {
      const oldDate = new Date('2020-01-01').toISOString();
      expect(isReferralExpired(oldDate, 0)).toBe(false);
    });

    it('should not expire for recent referral', () => {
      const recentDate = new Date().toISOString();
      expect(isReferralExpired(recentDate, 90)).toBe(false);
    });

    it('should expire for old referral', () => {
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(); // 100 days ago
      expect(isReferralExpired(oldDate, 90)).toBe(true);
    });
  });

  describe('Referral Code Validation', () => {
    it('should validate correct codes', () => {
      expect(isValidReferralCode('REFJOHN1')).toBe(true);
      expect(isValidReferralCode('ABC123')).toBe(true);
    });

    it('should reject short codes', () => {
      expect(isValidReferralCode('ABC')).toBe(false);
    });

    it('should reject codes with special characters', () => {
      expect(isValidReferralCode('REF-123')).toBe(false);
      expect(isValidReferralCode('REF 123')).toBe(false);
    });
  });

  describe('Share Message Generation', () => {
    it('should generate share message', () => {
      const message = generateShareMessage('REFJOHN1', 'Mango Spa');
      expect(message).toContain('REFJOHN1');
      expect(message).toContain('Mango Spa');
      expect(message).toContain('15%');
    });

    it('should use custom discount in message', () => {
      const message = generateShareMessage('CODE123', 'Test Salon', 20);
      expect(message).toContain('20%');
    });
  });

  describe('Referral Link Generation', () => {
    it('should generate referral link', () => {
      const link = generateReferralLink('REFJOHN1');
      expect(link).toBe('https://book.mangospa.com/ref/REFJOHN1');
    });

    it('should use custom base URL', () => {
      const link = generateReferralLink('CODE123', 'https://custom.com');
      expect(link).toBe('https://custom.com/ref/CODE123');
    });
  });

  describe('referralsDB Operations', () => {
    it('should create a referral', async () => {
      const referral = await referralsDB.create({
        referrerClientId: testReferrer.id,
        referredClientId: testReferred.id,
        referredClientName: testReferred.name,
        referralLinkCode: testReferrer.loyaltyInfo?.referralCode || 'TEST123',
        referrerRewardIssued: false,
        referredRewardIssued: false,
      });

      createdReferralId = referral.id;

      expect(referral).toBeDefined();
      expect(referral.id).toBeDefined();
      expect(referral.referrerClientId).toBe(testReferrer.id);
      expect(referral.referredClientId).toBe(testReferred.id);
      expect(referral.syncStatus).toBe('local');
    });

    it('should get referral by referrer ID', async () => {
      const referrals = await referralsDB.getByReferrerId(testReferrer.id);
      expect(referrals).toBeDefined();
      expect(Array.isArray(referrals)).toBe(true);
      expect(referrals.some(r => r.id === createdReferralId)).toBe(true);
    });

    it('should get referral by referred ID', async () => {
      const referral = await referralsDB.getByReferredId(testReferred.id);
      expect(referral).toBeDefined();
      expect(referral?.id).toBe(createdReferralId);
    });

    it('should get referral by code', async () => {
      const code = testReferrer.loyaltyInfo?.referralCode || 'TEST123';
      const referral = await referralsDB.getByCode(code);
      expect(referral).toBeDefined();
      expect(referral?.id).toBe(createdReferralId);
    });

    it('should update referral', async () => {
      const updated = await referralsDB.update(createdReferralId, {
        referrerRewardIssued: true,
      });

      expect(updated).toBeDefined();
      expect(updated?.referrerRewardIssued).toBe(true);
    });

    it('should complete referral', async () => {
      const completed = await referralsDB.completeReferral(
        createdReferralId,
        'test-appointment-id'
      );

      expect(completed).toBeDefined();
      expect(completed?.completedAt).toBeDefined();
      expect(completed?.firstAppointmentId).toBe('test-appointment-id');
    });
  });

  describe('Default Settings', () => {
    it('should have valid default settings', () => {
      expect(DEFAULT_REFERRAL_SETTINGS.referrerRewardAmount).toBe(25);
      expect(DEFAULT_REFERRAL_SETTINGS.referredDiscountPercent).toBe(15);
      expect(DEFAULT_REFERRAL_SETTINGS.codeLength).toBe(6);
      expect(DEFAULT_REFERRAL_SETTINGS.expirationDays).toBe(90);
      expect(DEFAULT_REFERRAL_SETTINGS.autoIssueRewards).toBe(true);
    });
  });
});
