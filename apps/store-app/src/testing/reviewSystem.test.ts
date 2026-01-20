/**
 * Review System Tests
 * Tests for PRD 2.3.9: Reviews & Feedback
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../db/schema';
import { reviewRequestsDB, clientReviewsDB, clientsDB } from '../db/database';
import {
  DEFAULT_REVIEW_SETTINGS,
  generateReviewMessage,
  canRequestReview,
  calculateExpirationDate,
  calculateReviewAnalytics,
  shouldPromptExternalShare,
  getStarDisplay,
  getRatingLabel,
  isRequestExpired,
} from '../constants/reviewConfig';
import type { ReviewRequest, ClientReview, Client } from '../types';

// Helper to create a test client (kept for potential use in future tests)
const _createTestClient = async (overrides: Partial<Client> = {}): Promise<Client> => {
  const client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> = {
    storeId: 'test-salon',
    firstName: 'Test',
    lastName: 'Client',
    phone: '555-1234',
    isBlocked: false,
    isVip: false,
    ...overrides,
  };
  return await clientsDB.create(client);
};

// Helper to create a test review request
const createTestReviewRequest = async (overrides: Partial<ReviewRequest> = {}): Promise<ReviewRequest> => {
  const request: Omit<ReviewRequest, 'id' | 'createdAt' | 'syncStatus'> = {
    storeId: 'test-salon',
    clientId: 'test-client',
    clientName: 'Test Client',
    status: 'pending',
    sentVia: 'email',
    reminderCount: 0,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
  return await reviewRequestsDB.create(request);
};

describe('Review System', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.reviewRequests.clear();
    await db.clientReviews.clear();
    await db.clients.clear();
  });

  afterEach(async () => {
    await db.reviewRequests.clear();
    await db.clientReviews.clear();
    await db.clients.clear();
  });

  // ==================== CONFIG TESTS ====================

  describe('Review Configuration', () => {
    it('should have sensible default settings', () => {
      expect(DEFAULT_REVIEW_SETTINGS.autoRequestEnabled).toBe(true);
      expect(DEFAULT_REVIEW_SETTINGS.requestDelayHours).toBe(2);
      expect(DEFAULT_REVIEW_SETTINGS.maxRequestsPerMonth).toBe(2);
      expect(DEFAULT_REVIEW_SETTINGS.minRatingForExternalShare).toBe(4);
      expect(DEFAULT_REVIEW_SETTINGS.maxReminders).toBe(1);
    });

    it('should generate personalized review messages', () => {
      const template = 'Hi {clientName}, thank you for visiting {salonName}!';
      const result = generateReviewMessage(template, {
        clientName: 'John',
        salonName: 'Best Salon',
        reviewLink: 'https://review.link',
      });
      expect(result).toBe('Hi John, thank you for visiting Best Salon!');
    });

    it('should handle all placeholders in review messages', () => {
      const template = '{clientName} visited {salonName} for {serviceName} with {staffName}. Link: {reviewLink}';
      const result = generateReviewMessage(template, {
        clientName: 'Jane',
        salonName: 'Salon XYZ',
        serviceName: 'Haircut',
        staffName: 'Mike',
        reviewLink: 'https://review.com/123',
      });
      expect(result).toBe('Jane visited Salon XYZ for Haircut with Mike. Link: https://review.com/123');
    });
  });

  // ==================== UTILITY FUNCTION TESTS ====================

  describe('Utility Functions', () => {
    describe('canRequestReview', () => {
      it('should allow request when no recent requests exist', () => {
        expect(canRequestReview([])).toBe(true);
      });

      it('should allow request when under monthly limit', () => {
        const recentRequests: ReviewRequest[] = [{
          id: '1',
          storeId: 'test',
          clientId: 'client-1',
          clientName: 'Test',
          status: 'sent',
          sentVia: 'email',
          reminderCount: 0,
          expiresAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          syncStatus: 'local',
        }];
        expect(canRequestReview(recentRequests)).toBe(true);
      });

      it('should reject request when at monthly limit', () => {
        const now = new Date();
        const recentRequests: ReviewRequest[] = [
          {
            id: '1',
            storeId: 'test',
            clientId: 'client-1',
            clientName: 'Test',
            status: 'sent',
            sentVia: 'email',
            reminderCount: 0,
            expiresAt: now.toISOString(),
            createdAt: now.toISOString(),
            syncStatus: 'local',
          },
          {
            id: '2',
            storeId: 'test',
            clientId: 'client-1',
            clientName: 'Test',
            status: 'completed',
            sentVia: 'sms',
            reminderCount: 0,
            expiresAt: now.toISOString(),
            createdAt: now.toISOString(),
            syncStatus: 'local',
          },
        ];
        expect(canRequestReview(recentRequests)).toBe(false);
      });
    });

    describe('calculateExpirationDate', () => {
      it('should calculate expiration 7 days from now by default', () => {
        const now = new Date();
        const expiration = calculateExpirationDate(now);
        const daysDiff = Math.round((expiration.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        expect(daysDiff).toBe(7);
      });

      it('should use custom days when provided', () => {
        const now = new Date();
        const expiration = calculateExpirationDate(now, 14);
        const daysDiff = Math.round((expiration.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        expect(daysDiff).toBe(14);
      });
    });

    describe('isRequestExpired', () => {
      it('should return false for future date', () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        expect(isRequestExpired(futureDate)).toBe(false);
      });

      it('should return true for past date', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        expect(isRequestExpired(pastDate)).toBe(true);
      });
    });

    describe('shouldPromptExternalShare', () => {
      it('should prompt for 4+ star ratings', () => {
        expect(shouldPromptExternalShare(4)).toBe(true);
        expect(shouldPromptExternalShare(5)).toBe(true);
      });

      it('should not prompt for ratings below threshold', () => {
        expect(shouldPromptExternalShare(3)).toBe(false);
        expect(shouldPromptExternalShare(2)).toBe(false);
        expect(shouldPromptExternalShare(1)).toBe(false);
      });
    });

    describe('getStarDisplay', () => {
      it('should display correct stars for whole numbers', () => {
        expect(getStarDisplay(5)).toBe('★★★★★');
        expect(getStarDisplay(3)).toBe('★★★☆☆');
        expect(getStarDisplay(1)).toBe('★☆☆☆☆');
      });

      it('should display half star for .5 ratings', () => {
        expect(getStarDisplay(4.5)).toBe('★★★★½');
        expect(getStarDisplay(2.5)).toBe('★★½☆☆');
      });
    });

    describe('getRatingLabel', () => {
      it('should return correct labels', () => {
        expect(getRatingLabel(5)).toBe('Excellent');
        expect(getRatingLabel(4.5)).toBe('Excellent');
        expect(getRatingLabel(4)).toBe('Very Good');
        expect(getRatingLabel(3.5)).toBe('Good');
        expect(getRatingLabel(3)).toBe('Average');
        expect(getRatingLabel(2)).toBe('Below Average');
        expect(getRatingLabel(1)).toBe('Poor');
      });
    });
  });

  // ==================== ANALYTICS TESTS ====================

  describe('Review Analytics', () => {
    it('should return zero analytics for empty reviews', () => {
      const analytics = calculateReviewAnalytics([]);
      expect(analytics.totalReviews).toBe(0);
      expect(analytics.averageRating).toBe(0);
      expect(analytics.responseRate).toBe(0);
    });

    it('should calculate correct average rating', () => {
      const reviews: ClientReview[] = [
        { id: '1', clientId: 'c1', rating: 5, platform: 'internal', createdAt: new Date().toISOString(), syncStatus: 'local' },
        { id: '2', clientId: 'c2', rating: 4, platform: 'internal', createdAt: new Date().toISOString(), syncStatus: 'local' },
        { id: '3', clientId: 'c3', rating: 3, platform: 'internal', createdAt: new Date().toISOString(), syncStatus: 'local' },
      ];
      const analytics = calculateReviewAnalytics(reviews);
      expect(analytics.averageRating).toBe(4);
      expect(analytics.totalReviews).toBe(3);
    });

    it('should calculate rating distribution', () => {
      const reviews: ClientReview[] = [
        { id: '1', clientId: 'c1', rating: 5, platform: 'internal', createdAt: new Date().toISOString(), syncStatus: 'local' },
        { id: '2', clientId: 'c2', rating: 5, platform: 'internal', createdAt: new Date().toISOString(), syncStatus: 'local' },
        { id: '3', clientId: 'c3', rating: 4, platform: 'internal', createdAt: new Date().toISOString(), syncStatus: 'local' },
        { id: '4', clientId: 'c4', rating: 3, platform: 'google', createdAt: new Date().toISOString(), syncStatus: 'local' },
      ];
      const analytics = calculateReviewAnalytics(reviews);
      expect(analytics.ratingDistribution[5]).toBe(2);
      expect(analytics.ratingDistribution[4]).toBe(1);
      expect(analytics.ratingDistribution[3]).toBe(1);
      expect(analytics.ratingDistribution[2]).toBe(0);
      expect(analytics.ratingDistribution[1]).toBe(0);
    });

    it('should calculate response rate', () => {
      const reviews: ClientReview[] = [
        { id: '1', clientId: 'c1', rating: 5, platform: 'internal', staffResponse: 'Thank you!', createdAt: new Date().toISOString(), syncStatus: 'local' },
        { id: '2', clientId: 'c2', rating: 4, platform: 'internal', createdAt: new Date().toISOString(), syncStatus: 'local' },
      ];
      const analytics = calculateReviewAnalytics(reviews);
      expect(analytics.responseRate).toBe(50);
    });

    it('should calculate platform breakdown', () => {
      const reviews: ClientReview[] = [
        { id: '1', clientId: 'c1', rating: 5, platform: 'internal', createdAt: new Date().toISOString(), syncStatus: 'local' },
        { id: '2', clientId: 'c2', rating: 4, platform: 'google', createdAt: new Date().toISOString(), syncStatus: 'local' },
        { id: '3', clientId: 'c3', rating: 4, platform: 'google', createdAt: new Date().toISOString(), syncStatus: 'local' },
        { id: '4', clientId: 'c4', rating: 3, platform: 'yelp', createdAt: new Date().toISOString(), syncStatus: 'local' },
      ];
      const analytics = calculateReviewAnalytics(reviews);
      expect(analytics.platformBreakdown.internal).toBe(1);
      expect(analytics.platformBreakdown.google).toBe(2);
      expect(analytics.platformBreakdown.yelp).toBe(1);
      expect(analytics.platformBreakdown.facebook).toBe(0);
    });
  });

  // ==================== DATABASE OPERATIONS TESTS ====================

  describe('Review Requests Database Operations', () => {
    it('should create a review request', async () => {
      const request = await createTestReviewRequest();
      expect(request.id).toBeDefined();
      expect(request.status).toBe('pending');
      expect(request.reminderCount).toBe(0);
    });

    it('should get request by ID', async () => {
      const created = await createTestReviewRequest();
      const found = await reviewRequestsDB.getById(created.id);
      expect(found).toBeDefined();
      expect(found?.clientName).toBe('Test Client');
    });

    it('should get requests by client ID', async () => {
      await createTestReviewRequest({ clientId: 'client-1' });
      await createTestReviewRequest({ clientId: 'client-1' });
      await createTestReviewRequest({ clientId: 'client-2' });

      const requests = await reviewRequestsDB.getByClientId('client-1');
      expect(requests.length).toBe(2);
    });

    it('should get requests by status', async () => {
      await createTestReviewRequest({ status: 'pending' });
      await createTestReviewRequest({ status: 'sent' });
      await createTestReviewRequest({ status: 'sent' });

      const sentRequests = await reviewRequestsDB.getByStatus('test-salon', 'sent');
      expect(sentRequests.length).toBe(2);
    });

    it('should mark request as sent', async () => {
      const request = await createTestReviewRequest();
      const updated = await reviewRequestsDB.markSent(request.id, 'sms');

      expect(updated?.status).toBe('sent');
      expect(updated?.sentVia).toBe('sms');
      expect(updated?.sentAt).toBeDefined();
    });

    it('should mark request as opened', async () => {
      const request = await createTestReviewRequest({ status: 'sent' });
      const updated = await reviewRequestsDB.markOpened(request.id);

      expect(updated?.status).toBe('opened');
      expect(updated?.openedAt).toBeDefined();
    });

    it('should mark request as completed', async () => {
      const request = await createTestReviewRequest({ status: 'opened' });
      const updated = await reviewRequestsDB.markCompleted(request.id, 'review-123');

      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBeDefined();
      expect(updated?.reviewId).toBe('review-123');
    });

    it('should add reminder', async () => {
      const request = await createTestReviewRequest({ status: 'sent', reminderCount: 0 });
      const updated = await reviewRequestsDB.addReminder(request.id);

      expect(updated?.reminderCount).toBe(1);
      expect(updated?.lastReminderAt).toBeDefined();
    });

    it('should count recent requests by client', async () => {
      await createTestReviewRequest({ clientId: 'client-1' });
      await createTestReviewRequest({ clientId: 'client-1' });

      const count = await reviewRequestsDB.countRecentByClient('client-1', 30);
      expect(count).toBe(2);
    });

    it('should get requests by appointment ID', async () => {
      await createTestReviewRequest({ appointmentId: 'appt-123' });

      const request = await reviewRequestsDB.getByAppointmentId('appt-123');
      expect(request).toBeDefined();
      expect(request?.appointmentId).toBe('appt-123');
    });
  });

  // ==================== CLIENT REVIEWS DATABASE TESTS ====================

  describe('Client Reviews Database Operations', () => {
    it('should create a review', async () => {
      const review = await clientReviewsDB.create({
        clientId: 'client-1',
        rating: 5,
        comment: 'Great service!',
        platform: 'internal',
      });

      expect(review.id).toBeDefined();
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Great service!');
    });

    it('should get reviews by client ID', async () => {
      await clientReviewsDB.create({ clientId: 'client-1', rating: 5, platform: 'internal' });
      await clientReviewsDB.create({ clientId: 'client-1', rating: 4, platform: 'google' });

      const reviews = await clientReviewsDB.getByClientId('client-1');
      expect(reviews.length).toBe(2);
    });

    it('should add staff response', async () => {
      const review = await clientReviewsDB.create({
        clientId: 'client-1',
        rating: 5,
        platform: 'internal',
      });

      const updated = await clientReviewsDB.addResponse(review.id, 'Thank you for your feedback!');
      expect(updated?.staffResponse).toBe('Thank you for your feedback!');
      expect(updated?.respondedAt).toBeDefined();
    });

    it('should get reviews by staff ID', async () => {
      await clientReviewsDB.create({ clientId: 'c1', staffId: 'staff-1', rating: 5, platform: 'internal' });
      await clientReviewsDB.create({ clientId: 'c2', staffId: 'staff-1', rating: 4, platform: 'internal' });
      await clientReviewsDB.create({ clientId: 'c3', staffId: 'staff-2', rating: 5, platform: 'internal' });

      const reviews = await clientReviewsDB.getByStaffId('staff-1');
      expect(reviews.length).toBe(2);
    });
  });
});
