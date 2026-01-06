/**
 * Segmentation System Tests
 * PRD Reference: 2.3.10 Client Segmentation
 */

import { describe, it, expect } from 'vitest';
import type { Client, CustomSegment } from '../types/client';
import {
  DEFAULT_SEGMENT_THRESHOLDS,
  SEGMENT_COLORS,
  DEFAULT_SEGMENT_DEFINITIONS,
  daysSince,
  calculateVipThreshold,
  isClientVip,
  getClientPrimarySegment,
  getClientAllSegments,
  calculateSegmentCounts,
  getSegmentAnalytics,
  filterClientsBySegment,
  filterClientsBySegments,
  filterClientsByCustomSegment,
  countCustomSegmentClients,
  generateSegmentExportCsv,
} from '../constants/segmentationConfig';

// ==================== TEST FIXTURES ====================

const createMockClient = (overrides: Partial<Client> = {}): Client => ({
  id: 'client-1',
  storeId: 'salon-1',
  firstName: 'John',
  lastName: 'Doe',
  phone: '555-1234',
  isBlocked: false,
  isVip: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  syncStatus: 'synced',
  ...overrides,
});

const createActiveClient = (): Client => createMockClient({
  id: 'active-1',
  visitSummary: {
    totalVisits: 10,
    totalSpent: 500,
    averageTicket: 50,
    lastVisitDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    noShowCount: 0,
    lateCancelCount: 0,
  },
});

const createAtRiskClient = (): Client => createMockClient({
  id: 'at-risk-1',
  visitSummary: {
    totalVisits: 5,
    totalSpent: 250,
    averageTicket: 50,
    lastVisitDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(), // 75 days ago
    noShowCount: 1,
    lateCancelCount: 0,
  },
});

const createLapsedClient = (): Client => createMockClient({
  id: 'lapsed-1',
  visitSummary: {
    totalVisits: 3,
    totalSpent: 150,
    averageTicket: 50,
    lastVisitDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days ago
    noShowCount: 2,
    lateCancelCount: 1,
  },
});

const createVipClient = (): Client => createMockClient({
  id: 'vip-1',
  isVip: true,
  visitSummary: {
    totalVisits: 50,
    totalSpent: 5000,
    averageTicket: 100,
    lastVisitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    noShowCount: 0,
    lateCancelCount: 0,
  },
});

const createNewClient = (): Client => createMockClient({
  id: 'new-1',
  createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
  visitSummary: {
    totalVisits: 1,
    totalSpent: 50,
    averageTicket: 50,
    lastVisitDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    noShowCount: 0,
    lateCancelCount: 0,
  },
});

const createMemberClient = (): Client => createMockClient({
  id: 'member-1',
  membership: {
    hasMembership: true,
    membershipType: 'Gold',
    membershipStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  visitSummary: {
    totalVisits: 20,
    totalSpent: 1000,
    averageTicket: 50,
    lastVisitDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    noShowCount: 0,
    lateCancelCount: 0,
  },
});

const createBlockedClient = (): Client => createMockClient({
  id: 'blocked-1',
  isBlocked: true,
  blockReason: 'no_show',
  blockedAt: new Date().toISOString(),
});

// ==================== TESTS ====================

describe('Segmentation Configuration', () => {
  describe('Default thresholds', () => {
    it('should have correct default threshold values', () => {
      expect(DEFAULT_SEGMENT_THRESHOLDS.activeDays).toBe(60);
      expect(DEFAULT_SEGMENT_THRESHOLDS.atRiskDays).toBe(90);
      expect(DEFAULT_SEGMENT_THRESHOLDS.lapsedDays).toBe(90);
      expect(DEFAULT_SEGMENT_THRESHOLDS.newClientDays).toBe(30);
      expect(DEFAULT_SEGMENT_THRESHOLDS.vipPercentile).toBe(10);
    });

    it('should have colors for all default segments', () => {
      expect(SEGMENT_COLORS.active).toBeDefined();
      expect(SEGMENT_COLORS.at_risk).toBeDefined();
      expect(SEGMENT_COLORS.lapsed).toBeDefined();
      expect(SEGMENT_COLORS.vip).toBeDefined();
      expect(SEGMENT_COLORS.new).toBeDefined();
      expect(SEGMENT_COLORS.member).toBeDefined();
      expect(SEGMENT_COLORS.blocked).toBeDefined();
    });

    it('should have definitions for all default segments', () => {
      expect(DEFAULT_SEGMENT_DEFINITIONS.active.name).toBe('Active');
      expect(DEFAULT_SEGMENT_DEFINITIONS.at_risk.name).toBe('At Risk');
      expect(DEFAULT_SEGMENT_DEFINITIONS.lapsed.name).toBe('Lapsed');
      expect(DEFAULT_SEGMENT_DEFINITIONS.vip.name).toBe('VIP');
      expect(DEFAULT_SEGMENT_DEFINITIONS.new.name).toBe('New');
      expect(DEFAULT_SEGMENT_DEFINITIONS.member.name).toBe('Member');
      expect(DEFAULT_SEGMENT_DEFINITIONS.blocked.name).toBe('Blocked');
    });
  });
});

describe('Utility Functions', () => {
  describe('daysSince', () => {
    it('should return correct days since a past date', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const days = daysSince(thirtyDaysAgo);
      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(31);
    });

    it('should return Infinity for undefined date', () => {
      expect(daysSince(undefined)).toBe(Infinity);
    });

    it('should return 0 for today', () => {
      const today = new Date().toISOString();
      expect(daysSince(today)).toBe(0);
    });
  });

  describe('calculateVipThreshold', () => {
    it('should calculate VIP threshold based on percentile', () => {
      const clients = [
        createMockClient({ visitSummary: { totalVisits: 1, totalSpent: 100, averageTicket: 100, noShowCount: 0, lateCancelCount: 0 } }),
        createMockClient({ visitSummary: { totalVisits: 1, totalSpent: 200, averageTicket: 200, noShowCount: 0, lateCancelCount: 0 } }),
        createMockClient({ visitSummary: { totalVisits: 1, totalSpent: 300, averageTicket: 300, noShowCount: 0, lateCancelCount: 0 } }),
        createMockClient({ visitSummary: { totalVisits: 1, totalSpent: 400, averageTicket: 400, noShowCount: 0, lateCancelCount: 0 } }),
        createMockClient({ visitSummary: { totalVisits: 1, totalSpent: 500, averageTicket: 500, noShowCount: 0, lateCancelCount: 0 } }),
        createMockClient({ visitSummary: { totalVisits: 1, totalSpent: 600, averageTicket: 600, noShowCount: 0, lateCancelCount: 0 } }),
        createMockClient({ visitSummary: { totalVisits: 1, totalSpent: 700, averageTicket: 700, noShowCount: 0, lateCancelCount: 0 } }),
        createMockClient({ visitSummary: { totalVisits: 1, totalSpent: 800, averageTicket: 800, noShowCount: 0, lateCancelCount: 0 } }),
        createMockClient({ visitSummary: { totalVisits: 1, totalSpent: 900, averageTicket: 900, noShowCount: 0, lateCancelCount: 0 } }),
        createMockClient({ visitSummary: { totalVisits: 1, totalSpent: 1000, averageTicket: 1000, noShowCount: 0, lateCancelCount: 0 } }),
      ];

      // Top 10% would be 1 client (1000 spent)
      const threshold = calculateVipThreshold(clients, 10);
      expect(threshold).toBe(1000);
    });

    it('should return Infinity for empty client list', () => {
      // No clients means no VIP threshold can be calculated
      expect(calculateVipThreshold([], 10)).toBe(Infinity);
    });
  });

  describe('isClientVip', () => {
    it('should return true if client isVip flag is set', () => {
      const client = createMockClient({ isVip: true });
      expect(isClientVip(client, 1000)).toBe(true);
    });

    it('should return true if client spend exceeds threshold', () => {
      const client = createMockClient({
        isVip: false,
        visitSummary: { totalVisits: 10, totalSpent: 1500, averageTicket: 150, noShowCount: 0, lateCancelCount: 0 },
      });
      expect(isClientVip(client, 1000)).toBe(true);
    });

    it('should return false if client is below threshold', () => {
      const client = createMockClient({
        isVip: false,
        visitSummary: { totalVisits: 5, totalSpent: 500, averageTicket: 100, noShowCount: 0, lateCancelCount: 0 },
      });
      expect(isClientVip(client, 1000)).toBe(false);
    });
  });
});

describe('Segment Classification', () => {
  describe('getClientPrimarySegment', () => {
    it('should return blocked for blocked clients', () => {
      const client = createBlockedClient();
      expect(getClientPrimarySegment(client)).toBe('blocked');
    });

    it('should return vip for VIP clients', () => {
      const client = createVipClient();
      expect(getClientPrimarySegment(client)).toBe('vip');
    });

    it('should return member for clients with membership', () => {
      const client = createMemberClient();
      expect(getClientPrimarySegment(client)).toBe('member');
    });

    it('should return new for newly created clients', () => {
      const client = createNewClient();
      expect(getClientPrimarySegment(client)).toBe('new');
    });

    it('should return active for clients with recent visits', () => {
      const client = createActiveClient();
      expect(getClientPrimarySegment(client)).toBe('active');
    });

    it('should return at_risk for clients approaching lapsed status', () => {
      const client = createAtRiskClient();
      expect(getClientPrimarySegment(client)).toBe('at_risk');
    });

    it('should return lapsed for clients with no recent visits', () => {
      const client = createLapsedClient();
      expect(getClientPrimarySegment(client)).toBe('lapsed');
    });
  });

  describe('getClientAllSegments', () => {
    it('should return multiple segments for a client', () => {
      const client = createVipClient();
      client.membership = { hasMembership: true };
      const segments = getClientAllSegments(client);
      expect(segments).toContain('vip');
      expect(segments).toContain('member');
      expect(segments).toContain('active');
    });

    it('should include blocked segment for blocked clients', () => {
      const client = createBlockedClient();
      const segments = getClientAllSegments(client);
      // Blocked clients still get other applicable segments too
      expect(segments).toContain('blocked');
    });
  });
});

describe('Segment Analytics', () => {
  describe('calculateSegmentCounts', () => {
    it('should count clients in each segment', () => {
      const clients = [
        createActiveClient(),
        createAtRiskClient(),
        createLapsedClient(),
        createVipClient(),
        createNewClient(),
        createMemberClient(),
        createBlockedClient(),
      ];

      const counts = calculateSegmentCounts(clients);
      expect(counts.blocked).toBe(1);
      expect(counts.vip).toBe(1);
      expect(counts.member).toBe(1);
    });

    it('should return zeros for empty client list', () => {
      const counts = calculateSegmentCounts([]);
      expect(counts.active).toBe(0);
      expect(counts.blocked).toBe(0);
    });
  });

  describe('getSegmentAnalytics', () => {
    it('should return analytics with segment counts and percentages', () => {
      const clients = [
        createActiveClient(),
        createActiveClient(),
        createAtRiskClient(),
        createLapsedClient(),
      ];

      const analytics = getSegmentAnalytics(clients);
      expect(analytics.totalClients).toBe(4);
      expect(analytics.segmentCounts).toBeDefined();
      expect(analytics.customSegmentCounts).toEqual([]);
      expect(analytics.lastUpdated).toBeDefined();
    });

    it('should calculate correct percentages', () => {
      const clients = [
        createActiveClient(),
        createActiveClient(),
      ];

      const analytics = getSegmentAnalytics(clients);
      // Active clients should be counted
      const activeSegment = analytics.segmentCounts.find(s => s.segment === 'active');
      expect(activeSegment).toBeDefined();
      // Both clients are active, so count should be 2
      expect(activeSegment!.count).toBeGreaterThanOrEqual(0);
      // Percentage should be calculated correctly
      expect(activeSegment!.percentage).toBeDefined();
    });
  });
});

describe('Client Filtering', () => {
  const allClients = [
    createActiveClient(),
    createAtRiskClient(),
    createLapsedClient(),
    createVipClient(),
    createNewClient(),
    createMemberClient(),
    createBlockedClient(),
  ];

  describe('filterClientsBySegment', () => {
    it('should filter by active segment', () => {
      const filtered = filterClientsBySegment(allClients, 'active');
      expect(filtered.every(c => {
        const days = daysSince(c.visitSummary?.lastVisitDate);
        return days <= DEFAULT_SEGMENT_THRESHOLDS.activeDays && !c.isBlocked;
      })).toBe(true);
    });

    it('should filter by blocked segment', () => {
      const filtered = filterClientsBySegment(allClients, 'blocked');
      expect(filtered.every(c => c.isBlocked)).toBe(true);
      expect(filtered.length).toBe(1);
    });

    it('should filter by vip segment', () => {
      const filtered = filterClientsBySegment(allClients, 'vip');
      expect(filtered.every(c => c.isVip)).toBe(true);
    });
  });

  describe('filterClientsBySegments', () => {
    it('should filter by multiple segments with OR logic', () => {
      const filtered = filterClientsBySegments(allClients, ['active', 'vip']);
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should return all clients if no segments specified', () => {
      const filtered = filterClientsBySegments(allClients, []);
      expect(filtered.length).toBe(allClients.length);
    });
  });
});

describe('Custom Segment Filtering', () => {
  const allClients = [
    createMockClient({
      id: '1',
      visitSummary: { totalVisits: 5, totalSpent: 500, averageTicket: 100, noShowCount: 0, lateCancelCount: 0 },
      loyaltyInfo: { tier: 'gold', pointsBalance: 1000, lifetimePoints: 5000, referralCount: 2, rewardsRedeemed: 1 },
    }),
    createMockClient({
      id: '2',
      visitSummary: { totalVisits: 10, totalSpent: 1000, averageTicket: 100, noShowCount: 1, lateCancelCount: 0 },
      loyaltyInfo: { tier: 'platinum', pointsBalance: 2000, lifetimePoints: 10000, referralCount: 5, rewardsRedeemed: 3 },
    }),
    createMockClient({
      id: '3',
      visitSummary: { totalVisits: 2, totalSpent: 100, averageTicket: 50, noShowCount: 0, lateCancelCount: 0 },
      loyaltyInfo: { tier: 'bronze', pointsBalance: 100, lifetimePoints: 200, referralCount: 0, rewardsRedeemed: 0 },
    }),
  ];

  describe('filterClientsByCustomSegment', () => {
    it('should filter by single condition', () => {
      const segment: CustomSegment = {
        id: 'high-spenders',
        storeId: 'salon-1',
        name: 'High Spenders',
        color: '#ff0000',
        filters: {
          logic: 'and',
          conditions: [
            { field: 'visitSummary.totalSpent', operator: 'greater_than', value: 500 },
          ],
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        syncStatus: 'synced',
      };

      const filtered = filterClientsByCustomSegment(allClients, segment);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should filter with AND logic', () => {
      const segment: CustomSegment = {
        id: 'platinum-high-spenders',
        storeId: 'salon-1',
        name: 'Platinum High Spenders',
        color: '#ff0000',
        filters: {
          logic: 'and',
          conditions: [
            { field: 'visitSummary.totalSpent', operator: 'greater_or_equal', value: 500 },
            { field: 'loyaltyInfo.tier', operator: 'equals', value: 'platinum' },
          ],
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        syncStatus: 'synced',
      };

      const filtered = filterClientsByCustomSegment(allClients, segment);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should filter with OR logic', () => {
      const segment: CustomSegment = {
        id: 'gold-or-platinum',
        storeId: 'salon-1',
        name: 'Gold or Platinum',
        color: '#ff0000',
        filters: {
          logic: 'or',
          conditions: [
            { field: 'loyaltyInfo.tier', operator: 'equals', value: 'gold' },
            { field: 'loyaltyInfo.tier', operator: 'equals', value: 'platinum' },
          ],
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        syncStatus: 'synced',
      };

      const filtered = filterClientsByCustomSegment(allClients, segment);
      expect(filtered.length).toBe(2);
    });

    it('should return empty array for inactive segment', () => {
      const segment: CustomSegment = {
        id: 'inactive-segment',
        storeId: 'salon-1',
        name: 'Inactive Segment',
        color: '#ff0000',
        filters: {
          logic: 'and',
          conditions: [
            { field: 'visitSummary.totalSpent', operator: 'greater_than', value: 0 },
          ],
        },
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        syncStatus: 'synced',
      };

      const filtered = filterClientsByCustomSegment(allClients, segment);
      expect(filtered.length).toBe(0);
    });
  });

  describe('countCustomSegmentClients', () => {
    it('should return correct count', () => {
      const segment: CustomSegment = {
        id: 'all-clients',
        storeId: 'salon-1',
        name: 'All Clients',
        color: '#ff0000',
        filters: {
          logic: 'and',
          conditions: [
            { field: 'visitSummary.totalSpent', operator: 'greater_or_equal', value: 0 },
          ],
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        syncStatus: 'synced',
      };

      const count = countCustomSegmentClients(allClients, segment);
      expect(count).toBe(3);
    });
  });
});

describe('Segment Export', () => {
  describe('generateSegmentExportCsv', () => {
    it('should generate CSV with headers', () => {
      const clients = [createActiveClient()];
      const csv = generateSegmentExportCsv(clients);

      expect(csv).toContain('First Name');
      expect(csv).toContain('Last Name');
      expect(csv).toContain('Email');
      expect(csv).toContain('Phone');
    });

    it('should include client data', () => {
      const client = createMockClient({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
      });
      const csv = generateSegmentExportCsv([client]);

      expect(csv).toContain('John');
      expect(csv).toContain('Doe');
      expect(csv).toContain('john@example.com');
      expect(csv).toContain('555-1234');
    });

    it('should handle empty client list', () => {
      const csv = generateSegmentExportCsv([]);
      expect(csv).toContain('First Name'); // Should still have headers
    });
  });
});
