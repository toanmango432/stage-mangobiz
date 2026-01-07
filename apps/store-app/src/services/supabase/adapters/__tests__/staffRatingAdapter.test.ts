/**
 * Unit Tests for Staff Rating Adapter
 *
 * Tests the conversion between Supabase StaffRatingRow and app StaffRating types.
 */

import { describe, it, expect } from 'vitest';
import {
  toStaffRating,
  toStaffRatings,
  toStaffRatingInsert,
  toStaffRatingUpdate,
  getStarDisplay,
  getRatingColor,
  getSourceDisplay,
  getStatusDisplay,
} from '../staffRatingAdapter';
import type { StaffRatingRow } from '../../types';
import type { StaffRating } from '../staffRatingAdapter';

// Mock StaffRatingRow factory
function createMockStaffRatingRow(overrides: Partial<StaffRatingRow> = {}): StaffRatingRow {
  const now = new Date().toISOString();
  return {
    id: 'rating-001',
    store_id: 'store-001',
    staff_id: 'staff-001',
    client_id: 'client-001',
    client_name: 'Jane Smith',
    appointment_id: 'appt-001',
    ticket_id: 'ticket-001',
    rating: 5,
    review_text: 'Excellent service! Best haircut ever.',
    is_public: true,
    is_verified: true,
    status: 'active',
    flagged_reason: null,
    moderated_by: null,
    moderated_at: null,
    moderation_notes: null,
    response_text: null,
    response_by: null,
    response_at: null,
    services_performed: ['Haircut', 'Styling'],
    service_date: '2026-01-06',
    source: 'in_app',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe('staffRatingAdapter', () => {
  describe('toStaffRating', () => {
    it('should convert basic StaffRatingRow to StaffRating', () => {
      const row = createMockStaffRatingRow();
      const rating = toStaffRating(row);

      expect(rating.id).toBe('rating-001');
      expect(rating.storeId).toBe('store-001');
      expect(rating.staffId).toBe('staff-001');
      expect(rating.rating).toBe(5);
      expect(rating.status).toBe('active');
    });

    it('should convert client info correctly', () => {
      const row = createMockStaffRatingRow();
      const rating = toStaffRating(row);

      expect(rating.clientId).toBe('client-001');
      expect(rating.clientName).toBe('Jane Smith');
    });

    it('should convert review details correctly', () => {
      const row = createMockStaffRatingRow();
      const rating = toStaffRating(row);

      expect(rating.reviewText).toBe('Excellent service! Best haircut ever.');
      expect(rating.isPublic).toBe(true);
      expect(rating.isVerified).toBe(true);
    });

    it('should handle services performed', () => {
      const row = createMockStaffRatingRow();
      const rating = toStaffRating(row);

      expect(rating.servicesPerformed).toEqual(['Haircut', 'Styling']);
      expect(rating.serviceDate).toBe('2026-01-06');
    });

    it('should handle flagged ratings', () => {
      const now = new Date().toISOString();
      const row = createMockStaffRatingRow({
        status: 'flagged',
        flagged_reason: 'Inappropriate content',
        moderated_by: 'moderator-001',
        moderated_at: now,
        moderation_notes: 'Under review',
      });
      const rating = toStaffRating(row);

      expect(rating.status).toBe('flagged');
      expect(rating.flaggedReason).toBe('Inappropriate content');
      expect(rating.moderatedBy).toBe('moderator-001');
      expect(rating.moderatedAt).toBe(now);
      expect(rating.moderationNotes).toBe('Under review');
    });

    it('should handle response to review', () => {
      const now = new Date().toISOString();
      const row = createMockStaffRatingRow({
        response_text: 'Thank you for your kind words!',
        response_by: 'staff-001',
        response_at: now,
      });
      const rating = toStaffRating(row);

      expect(rating.responseText).toBe('Thank you for your kind words!');
      expect(rating.responseBy).toBe('staff-001');
      expect(rating.responseAt).toBe(now);
    });

    it('should handle different sources', () => {
      const sources = ['in_app', 'online_booking', 'google', 'yelp', 'imported'] as const;

      sources.forEach((source) => {
        const row = createMockStaffRatingRow({ source });
        const rating = toStaffRating(row);
        expect(rating.source).toBe(source);
      });
    });

    it('should handle null optional fields gracefully', () => {
      const row = createMockStaffRatingRow({
        client_id: null,
        client_name: null,
        appointment_id: null,
        ticket_id: null,
        review_text: null,
        services_performed: null,
        service_date: null,
      });
      const rating = toStaffRating(row);

      expect(rating.clientId).toBeNull();
      expect(rating.clientName).toBeNull();
      expect(rating.reviewText).toBeNull();
      expect(rating.servicesPerformed).toEqual([]);
      expect(rating.serviceDate).toBeNull();
    });
  });

  describe('toStaffRatings', () => {
    it('should convert array of StaffRatingRows', () => {
      const rows = [
        createMockStaffRatingRow({ id: 'rating-001', rating: 5 }),
        createMockStaffRatingRow({ id: 'rating-002', rating: 4 }),
      ];
      const ratings = toStaffRatings(rows);

      expect(ratings).toHaveLength(2);
      expect(ratings[0].id).toBe('rating-001');
      expect(ratings[0].rating).toBe(5);
      expect(ratings[1].id).toBe('rating-002');
      expect(ratings[1].rating).toBe(4);
    });

    it('should return empty array for empty input', () => {
      const ratings = toStaffRatings([]);
      expect(ratings).toEqual([]);
    });
  });

  describe('toStaffRatingInsert', () => {
    it('should convert StaffRating to insert format', () => {
      const rating: Omit<StaffRating, 'id' | 'createdAt' | 'updatedAt'> = {
        storeId: 'store-001',
        staffId: 'staff-001',
        clientId: 'client-002',
        clientName: 'Bob Johnson',
        appointmentId: 'appt-002',
        ticketId: 'ticket-002',
        rating: 4,
        reviewText: 'Great service!',
        isPublic: true,
        isVerified: false,
        status: 'active',
        flaggedReason: null,
        moderatedBy: null,
        moderatedAt: null,
        moderationNotes: null,
        responseText: null,
        responseBy: null,
        responseAt: null,
        servicesPerformed: ['Massage'],
        serviceDate: '2026-01-07',
        source: 'in_app',
      };
      const insert = toStaffRatingInsert(rating, 'store-001');

      expect(insert.store_id).toBe('store-001');
      expect(insert.staff_id).toBe('staff-001');
      expect(insert.rating).toBe(4);
      expect(insert.review_text).toBe('Great service!');
      expect(insert.is_public).toBe(true);
      expect(insert.status).toBe('active');
    });

    it('should handle null optional fields correctly', () => {
      const rating: Omit<StaffRating, 'id' | 'createdAt' | 'updatedAt'> = {
        storeId: 'store-001',
        staffId: 'staff-001',
        clientId: null,
        clientName: null,
        appointmentId: null,
        ticketId: null,
        rating: 3,
        reviewText: null,
        isPublic: true,
        isVerified: false,
        status: 'active',
        flaggedReason: null,
        moderatedBy: null,
        moderatedAt: null,
        moderationNotes: null,
        responseText: null,
        responseBy: null,
        responseAt: null,
        servicesPerformed: [],
        serviceDate: null,
        source: 'in_app',
      };
      const insert = toStaffRatingInsert(rating);

      expect(insert.client_id).toBeNull();
      expect(insert.client_name).toBeNull();
      expect(insert.review_text).toBeNull();
      expect(insert.services_performed).toBeNull();
    });
  });

  describe('toStaffRatingUpdate', () => {
    it('should convert partial updates correctly', () => {
      const updates: Partial<StaffRating> = {
        rating: 4,
        reviewText: 'Updated review',
        isPublic: false,
      };
      const result = toStaffRatingUpdate(updates);

      expect(result.rating).toBe(4);
      expect(result.review_text).toBe('Updated review');
      expect(result.is_public).toBe(false);
    });

    it('should handle status updates', () => {
      const updates: Partial<StaffRating> = {
        status: 'hidden',
      };
      const result = toStaffRatingUpdate(updates);

      expect(result.status).toBe('hidden');
    });

    it('should handle flagging updates', () => {
      const now = new Date().toISOString();
      const updates: Partial<StaffRating> = {
        status: 'flagged',
        flaggedReason: 'Inappropriate language',
        moderatedBy: 'mod-001',
        moderatedAt: now,
        moderationNotes: 'Flagged for review',
      };
      const result = toStaffRatingUpdate(updates);

      expect(result.status).toBe('flagged');
      expect(result.flagged_reason).toBe('Inappropriate language');
      expect(result.moderated_by).toBe('mod-001');
      expect(result.moderated_at).toBe(now);
      expect(result.moderation_notes).toBe('Flagged for review');
    });

    it('should handle response updates', () => {
      const now = new Date().toISOString();
      const updates: Partial<StaffRating> = {
        responseText: 'Thank you for your feedback!',
        responseBy: 'staff-001',
        responseAt: now,
      };
      const result = toStaffRatingUpdate(updates);

      expect(result.response_text).toBe('Thank you for your feedback!');
      expect(result.response_by).toBe('staff-001');
      expect(result.response_at).toBe(now);
    });

    it('should return empty object for no updates', () => {
      const result = toStaffRatingUpdate({});
      expect(result).toEqual({});
    });
  });

  describe('getStarDisplay', () => {
    it('should display 5 full stars for rating 5', () => {
      expect(getStarDisplay(5)).toBe('★★★★★');
    });

    it('should display 4 full stars and 1 empty for rating 4', () => {
      expect(getStarDisplay(4)).toBe('★★★★☆');
    });

    it('should display half star for 4.5', () => {
      expect(getStarDisplay(4.5)).toBe('★★★★½');
    });

    it('should display 3 full and 1 half for 3.5', () => {
      expect(getStarDisplay(3.5)).toBe('★★★½☆');
    });

    it('should display 0 stars for rating 0', () => {
      expect(getStarDisplay(0)).toBe('☆☆☆☆☆');
    });
  });

  describe('getRatingColor', () => {
    it('should return emerald for 5 stars', () => {
      expect(getRatingColor(5)).toBe('text-emerald-600');
    });

    it('should return emerald for 4.5 stars', () => {
      expect(getRatingColor(4.5)).toBe('text-emerald-600');
    });

    it('should return green for 4 stars', () => {
      expect(getRatingColor(4)).toBe('text-green-600');
    });

    it('should return lime for 3.5 stars', () => {
      expect(getRatingColor(3.5)).toBe('text-lime-600');
    });

    it('should return amber for 3 stars', () => {
      expect(getRatingColor(3)).toBe('text-amber-600');
    });

    it('should return orange for 2 stars', () => {
      expect(getRatingColor(2)).toBe('text-orange-600');
    });

    it('should return red for 1 star', () => {
      expect(getRatingColor(1)).toBe('text-red-600');
    });
  });

  describe('getSourceDisplay', () => {
    it('should return correct display for in_app', () => {
      const display = getSourceDisplay('in_app');
      expect(display.label).toBe('In-App');
      expect(display.icon).toBe('📱');
    });

    it('should return correct display for google', () => {
      const display = getSourceDisplay('google');
      expect(display.label).toBe('Google');
      expect(display.icon).toBe('🔍');
    });

    it('should return correct display for yelp', () => {
      const display = getSourceDisplay('yelp');
      expect(display.label).toBe('Yelp');
      expect(display.icon).toBe('🟡');
    });
  });

  describe('getStatusDisplay', () => {
    it('should return correct display for active', () => {
      const display = getStatusDisplay('active');
      expect(display.label).toBe('Active');
      expect(display.color).toBe('text-emerald-600');
    });

    it('should return correct display for hidden', () => {
      const display = getStatusDisplay('hidden');
      expect(display.label).toBe('Hidden');
      expect(display.color).toBe('text-gray-500');
    });

    it('should return correct display for flagged', () => {
      const display = getStatusDisplay('flagged');
      expect(display.label).toBe('Flagged');
      expect(display.color).toBe('text-amber-600');
    });

    it('should return correct display for removed', () => {
      const display = getStatusDisplay('removed');
      expect(display.label).toBe('Removed');
      expect(display.color).toBe('text-red-600');
    });

    it('should return correct display for pending_review', () => {
      const display = getStatusDisplay('pending_review');
      expect(display.label).toBe('Pending Review');
      expect(display.color).toBe('text-blue-600');
    });
  });
});
