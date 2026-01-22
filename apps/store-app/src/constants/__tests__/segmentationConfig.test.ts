/**
 * Unit Tests for Segment Filter Logic
 *
 * Tests the segmentation configuration functions:
 * - daysSince: Calculate days between date and now
 * - getClientPrimarySegment: Determine primary segment for a client
 * - filterClientsBySegment: Filter clients by default segment
 * - filterClientsByCustomSegment: Filter clients by custom segment conditions
 * - evaluateCondition: Evaluate filter conditions
 *
 * Phase 3 of Client Module: Forms, Segments, Import/Export
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Client, CustomSegment, SegmentFilterCondition } from '../../types/client';
import {
  daysSince,
  calculateVipThreshold,
  isClientVip,
  getClientPrimarySegment,
  getClientAllSegments,
  filterClientsBySegment,
  filterClientsByCustomSegment,
  calculateSegmentCounts,
  DEFAULT_SEGMENT_THRESHOLDS,
} from '../segmentationConfig';

// ==================== TEST UTILITIES ====================

/**
 * Create a mock client for testing
 */
function createMockClient(overrides: Partial<Client> = {}): Client {
  const now = new Date();
  return {
    id: `client-${Math.random().toString(36).substr(2, 9)}`,
    storeId: 'store-001',
    firstName: 'Test',
    lastName: 'Client',
    phone: '+15551234567',
    isBlocked: false,
    isVip: false,
    syncStatus: 'synced',
    createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
    updatedAt: now.toISOString(),
    visitSummary: {
      totalVisits: 5,
      totalSpent: 500,
      averageTicket: 100,
      lastVisitDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      noShowCount: 0,
      lateCancelCount: 0,
    },
    loyaltyInfo: {
      tier: 'bronze',
      pointsBalance: 100,
      lifetimePoints: 500,
      referralCount: 0,
      rewardsRedeemed: 0,
    },
    ...overrides,
  };
}

/**
 * Create a mock custom segment for testing
 */
function createMockCustomSegment(
  conditions: SegmentFilterCondition[],
  logic: 'and' | 'or' = 'and'
): CustomSegment {
  return {
    id: `segment-${Math.random().toString(36).substr(2, 9)}`,
    storeId: 'store-001',
    name: 'Test Segment',
    description: 'A test segment',
    color: '#22c55e',
    filters: {
      logic,
      conditions,
    },
    isActive: true,
    createdBy: 'staff-001',
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ==================== daysSince TESTS ====================

describe('daysSince', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-22T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return 0 for today', () => {
    const today = new Date('2026-01-22T10:00:00Z').toISOString();
    expect(daysSince(today)).toBe(0);
  });

  it('should return correct days for past dates', () => {
    const thirtyDaysAgo = new Date('2025-12-23T12:00:00Z').toISOString();
    expect(daysSince(thirtyDaysAgo)).toBe(30);
  });

  it('should return Infinity for undefined', () => {
    expect(daysSince(undefined)).toBe(Infinity);
  });

  it('should return Infinity for empty string', () => {
    expect(daysSince('')).toBe(Infinity);
  });
});

// ==================== calculateVipThreshold TESTS ====================

describe('calculateVipThreshold', () => {
  it('should return Infinity for empty client list', () => {
    expect(calculateVipThreshold([])).toBe(Infinity);
  });

  it('should return Infinity when all clients have zero spend', () => {
    const clients = [
      createMockClient({ visitSummary: { ...createMockClient().visitSummary!, totalSpent: 0 } }),
      createMockClient({ visitSummary: { ...createMockClient().visitSummary!, totalSpent: 0 } }),
    ];
    expect(calculateVipThreshold(clients)).toBe(Infinity);
  });

  it('should calculate correct threshold for top 10%', () => {
    // Create 10 clients with spends: 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000
    const clients = Array.from({ length: 10 }, (_, i) =>
      createMockClient({
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: (i + 1) * 100 },
      })
    );

    // Top 10% of 10 clients = 1 client, should be 1000 (the highest)
    const threshold = calculateVipThreshold(clients, 10);
    expect(threshold).toBe(1000);
  });

  it('should calculate correct threshold for top 20%', () => {
    const clients = Array.from({ length: 10 }, (_, i) =>
      createMockClient({
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: (i + 1) * 100 },
      })
    );

    // Top 20% of 10 clients = 2 clients, threshold should be 900
    const threshold = calculateVipThreshold(clients, 20);
    expect(threshold).toBe(900);
  });
});

// ==================== isClientVip TESTS ====================

describe('isClientVip', () => {
  it('should return true if client is explicitly marked as VIP', () => {
    const client = createMockClient({ isVip: true });
    expect(isClientVip(client, 10000)).toBe(true); // Even with high threshold
  });

  it('should return true if client meets spend threshold', () => {
    const client = createMockClient({
      visitSummary: { ...createMockClient().visitSummary!, totalSpent: 1000 },
    });
    expect(isClientVip(client, 500)).toBe(true);
  });

  it('should return false if client does not meet threshold and not marked VIP', () => {
    const client = createMockClient({
      isVip: false,
      visitSummary: { ...createMockClient().visitSummary!, totalSpent: 100 },
    });
    expect(isClientVip(client, 500)).toBe(false);
  });

  it('should return false if threshold is 0', () => {
    const client = createMockClient({
      isVip: false,
      visitSummary: { ...createMockClient().visitSummary!, totalSpent: 100 },
    });
    expect(isClientVip(client, 0)).toBe(false);
  });
});

// ==================== getClientPrimarySegment TESTS ====================

describe('getClientPrimarySegment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-22T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "blocked" for blocked clients (highest priority)', () => {
    const client = createMockClient({
      isBlocked: true,
      isVip: true, // Even if VIP, blocked takes priority
    });
    expect(getClientPrimarySegment(client)).toBe('blocked');
  });

  it('should return "vip" for VIP clients', () => {
    const client = createMockClient({ isVip: true });
    expect(getClientPrimarySegment(client)).toBe('vip');
  });

  it('should return "member" for clients with active membership', () => {
    const client = createMockClient({
      membership: { hasMembership: true },
    });
    expect(getClientPrimarySegment(client)).toBe('member');
  });

  it('should return "new" for clients with one visit in last 30 days', () => {
    const client = createMockClient({
      visitSummary: {
        ...createMockClient().visitSummary!,
        totalVisits: 1,
        lastVisitDate: new Date('2026-01-10T12:00:00Z').toISOString(), // 12 days ago
      },
    });
    expect(getClientPrimarySegment(client)).toBe('new');
  });

  it('should return "active" for clients who visited within 60 days', () => {
    const client = createMockClient({
      visitSummary: {
        ...createMockClient().visitSummary!,
        totalVisits: 5,
        lastVisitDate: new Date('2025-12-25T12:00:00Z').toISOString(), // 28 days ago
      },
    });
    expect(getClientPrimarySegment(client)).toBe('active');
  });

  it('should return "at_risk" for clients 60-90 days since last visit', () => {
    const client = createMockClient({
      visitSummary: {
        ...createMockClient().visitSummary!,
        totalVisits: 5,
        lastVisitDate: new Date('2025-11-10T12:00:00Z').toISOString(), // ~73 days ago
      },
    });
    expect(getClientPrimarySegment(client)).toBe('at_risk');
  });

  it('should return "lapsed" for clients 90+ days since last visit', () => {
    const client = createMockClient({
      visitSummary: {
        ...createMockClient().visitSummary!,
        totalVisits: 5,
        lastVisitDate: new Date('2025-10-01T12:00:00Z').toISOString(), // 113 days ago
      },
    });
    expect(getClientPrimarySegment(client)).toBe('lapsed');
  });
});

// ==================== getClientAllSegments TESTS ====================

describe('getClientAllSegments', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-22T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should include multiple applicable segments', () => {
    const client = createMockClient({
      isVip: true,
      membership: { hasMembership: true },
      visitSummary: {
        ...createMockClient().visitSummary!,
        lastVisitDate: new Date('2026-01-10T12:00:00Z').toISOString(), // 12 days ago
      },
    });

    const segments = getClientAllSegments(client);
    expect(segments).toContain('vip');
    expect(segments).toContain('member');
    expect(segments).toContain('active');
  });

  it('should include blocked segment when client is blocked', () => {
    const client = createMockClient({ isBlocked: true });
    const segments = getClientAllSegments(client);
    expect(segments).toContain('blocked');
  });
});

// ==================== filterClientsBySegment TESTS ====================

describe('filterClientsBySegment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-22T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should filter VIP clients correctly', () => {
    // The VIP threshold is calculated based on top 10% spend from the same client pool.
    // With only 3 clients, top 10% = 0.3 clients, which rounds up to 1, so the highest
    // spender qualifies by threshold. To properly test the isVip flag, we need to:
    // 1. Have a larger pool so threshold math works out
    // 2. Or set non-VIP client spend to 0 so they don't qualify by spend
    // Here we use 10 clients so the math is clear: top 10% = 1 client
    const clients = [
      // These two are explicitly marked as VIP with low spend
      createMockClient({
        id: 'vip-1',
        isVip: true,
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 100 },
      }),
      createMockClient({
        id: 'vip-2',
        isVip: true,
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 200 },
      }),
      // Eight non-VIP clients with varying spend (below threshold)
      ...Array.from({ length: 8 }, (_, i) =>
        createMockClient({
          id: `normal-${i + 1}`,
          isVip: false,
          visitSummary: { ...createMockClient().visitSummary!, totalSpent: (i + 1) * 50 },
        })
      ),
    ];
    // Spends: 100, 200, 50, 100, 150, 200, 250, 300, 350, 400
    // Sorted desc: 400, 350, 300, 250, 200, 200, 150, 100, 100, 50
    // Top 10% of 10 = 1 client, threshold = 400
    // So only normal-8 (400) qualifies by spend, plus vip-1 and vip-2 by flag

    const vipClients = filterClientsBySegment(clients, 'vip');
    // vip-1, vip-2 by flag + normal-8 by spend = 3 total
    expect(vipClients).toHaveLength(3);
    expect(vipClients.map(c => c.id)).toContain('vip-1');
    expect(vipClients.map(c => c.id)).toContain('vip-2');
    expect(vipClients.map(c => c.id)).toContain('normal-8');
  });

  it('should filter blocked clients correctly', () => {
    const clients = [
      createMockClient({ id: 'blocked-1', isBlocked: true }),
      createMockClient({ id: 'normal-1', isBlocked: false }),
    ];

    const blockedClients = filterClientsBySegment(clients, 'blocked');
    expect(blockedClients).toHaveLength(1);
    expect(blockedClients[0].id).toBe('blocked-1');
  });
});

// ==================== filterClientsByCustomSegment TESTS ====================

describe('filterClientsByCustomSegment', () => {
  it('should filter by totalSpent greater than condition', () => {
    const clients = [
      createMockClient({
        id: 'high-spender',
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 1000 },
      }),
      createMockClient({
        id: 'low-spender',
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 100 },
      }),
    ];

    const segment = createMockCustomSegment([
      { field: 'visitSummary.totalSpent', operator: 'greater_than', value: 500 },
    ]);

    const filtered = filterClientsByCustomSegment(clients, segment);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('high-spender');
  });

  it('should filter by totalVisits equals condition', () => {
    const clients = [
      createMockClient({
        id: 'five-visits',
        visitSummary: { ...createMockClient().visitSummary!, totalVisits: 5 },
      }),
      createMockClient({
        id: 'ten-visits',
        visitSummary: { ...createMockClient().visitSummary!, totalVisits: 10 },
      }),
    ];

    const segment = createMockCustomSegment([
      { field: 'visitSummary.totalVisits', operator: 'equals', value: 5 },
    ]);

    const filtered = filterClientsByCustomSegment(clients, segment);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('five-visits');
  });

  it('should filter by loyaltyTier condition', () => {
    const clients = [
      createMockClient({
        id: 'gold-member',
        loyaltyInfo: { ...createMockClient().loyaltyInfo!, tier: 'gold' },
      }),
      createMockClient({
        id: 'bronze-member',
        loyaltyInfo: { ...createMockClient().loyaltyInfo!, tier: 'bronze' },
      }),
    ];

    const segment = createMockCustomSegment([
      { field: 'loyaltyInfo.tier', operator: 'equals', value: 'gold' },
    ]);

    const filtered = filterClientsByCustomSegment(clients, segment);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('gold-member');
  });

  it('should handle AND logic (all conditions must match)', () => {
    const clients = [
      createMockClient({
        id: 'match-all',
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 1000, totalVisits: 10 },
      }),
      createMockClient({
        id: 'match-one',
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 1000, totalVisits: 3 },
      }),
    ];

    const segment = createMockCustomSegment(
      [
        { field: 'visitSummary.totalSpent', operator: 'greater_than', value: 500 },
        { field: 'visitSummary.totalVisits', operator: 'greater_than', value: 5 },
      ],
      'and'
    );

    const filtered = filterClientsByCustomSegment(clients, segment);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('match-all');
  });

  it('should handle OR logic (any condition can match)', () => {
    const clients = [
      createMockClient({
        id: 'high-spender',
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 1000, totalVisits: 3 },
      }),
      createMockClient({
        id: 'frequent-visitor',
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 100, totalVisits: 10 },
      }),
      createMockClient({
        id: 'neither',
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 100, totalVisits: 3 },
      }),
    ];

    const segment = createMockCustomSegment(
      [
        { field: 'visitSummary.totalSpent', operator: 'greater_than', value: 500 },
        { field: 'visitSummary.totalVisits', operator: 'greater_than', value: 5 },
      ],
      'or'
    );

    const filtered = filterClientsByCustomSegment(clients, segment);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(c => c.id)).toContain('high-spender');
    expect(filtered.map(c => c.id)).toContain('frequent-visitor');
  });

  it('should filter by isVip boolean condition', () => {
    const clients = [
      createMockClient({ id: 'vip', isVip: true }),
      createMockClient({ id: 'not-vip', isVip: false }),
    ];

    const segment = createMockCustomSegment([
      { field: 'isVip', operator: 'equals', value: true },
    ]);

    const filtered = filterClientsByCustomSegment(clients, segment);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('vip');
  });

  it('should return empty array for inactive segment', () => {
    const clients = [createMockClient()];
    const segment = createMockCustomSegment([
      { field: 'visitSummary.totalSpent', operator: 'greater_than', value: 0 },
    ]);
    segment.isActive = false;

    const filtered = filterClientsByCustomSegment(clients, segment);
    expect(filtered).toHaveLength(0);
  });

  it('should filter by is_empty condition', () => {
    const clients = [
      createMockClient({ id: 'with-email', email: 'test@example.com' }),
      createMockClient({ id: 'without-email', email: undefined }),
    ];

    // For is_empty operator, value is ignored but must be a valid type
    const segment = createMockCustomSegment([
      { field: 'source', operator: 'is_empty', value: '' },
    ]);

    // Both clients have no source set, so both should match
    const filtered = filterClientsByCustomSegment(clients, segment);
    expect(filtered).toHaveLength(2);
  });

  it('should filter by is_not_empty condition', () => {
    const clients = [
      createMockClient({ id: 'with-source', source: 'referral' }),
      createMockClient({ id: 'without-source', source: undefined }),
    ];

    // For is_not_empty operator, value is ignored but must be a valid type
    const segment = createMockCustomSegment([
      { field: 'source', operator: 'is_not_empty', value: '' },
    ]);

    const filtered = filterClientsByCustomSegment(clients, segment);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('with-source');
  });
});

// ==================== calculateSegmentCounts TESTS ====================

describe('calculateSegmentCounts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-22T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should count clients by primary segment', () => {
    // With 4 clients and 10% VIP threshold, we need to ensure only isVip=true clients are VIP
    // Set low spends so that VIP threshold by spend won't trigger
    const clients = [
      createMockClient({
        id: 'vip-1',
        isVip: true,
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 10 },
      }),
      createMockClient({
        id: 'vip-2',
        isVip: true,
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 20 },
      }),
      createMockClient({
        id: 'active-1',
        isVip: false,
        visitSummary: {
          ...createMockClient().visitSummary!,
          totalSpent: 30,
          lastVisitDate: new Date('2026-01-10T12:00:00Z').toISOString(),
        },
      }),
      createMockClient({
        id: 'blocked-1',
        isBlocked: true,
        isVip: false,
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 40 },
      }),
    ];

    const counts = calculateSegmentCounts(clients);

    // blocked-1 has highest priority (blocked)
    expect(counts.blocked).toBe(1);
    // vip-1 and vip-2 are explicitly VIP
    expect(counts.vip).toBe(2);
    // active-1 visited within 60 days
    expect(counts.active).toBe(1);
  });

  it('should return zero counts for empty client list', () => {
    const counts = calculateSegmentCounts([]);

    expect(counts.vip).toBe(0);
    expect(counts.active).toBe(0);
    expect(counts.blocked).toBe(0);
    expect(counts.lapsed).toBe(0);
    expect(counts.at_risk).toBe(0);
    expect(counts.new).toBe(0);
    expect(counts.member).toBe(0);
  });
});

// ==================== OPERATOR TESTS ====================

describe('Segment filter operators', () => {
  it('should handle less_than operator', () => {
    const clients = [
      createMockClient({
        id: 'low',
        visitSummary: { ...createMockClient().visitSummary!, totalVisits: 3 },
      }),
      createMockClient({
        id: 'high',
        visitSummary: { ...createMockClient().visitSummary!, totalVisits: 10 },
      }),
    ];

    const segment = createMockCustomSegment([
      { field: 'visitSummary.totalVisits', operator: 'less_than', value: 5 },
    ]);

    const filtered = filterClientsByCustomSegment(clients, segment);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('low');
  });

  it('should handle greater_or_equal operator', () => {
    const clients = [
      createMockClient({
        id: 'equal',
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 500 },
      }),
      createMockClient({
        id: 'greater',
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 600 },
      }),
      createMockClient({
        id: 'less',
        visitSummary: { ...createMockClient().visitSummary!, totalSpent: 400 },
      }),
    ];

    const segment = createMockCustomSegment([
      { field: 'visitSummary.totalSpent', operator: 'greater_or_equal', value: 500 },
    ]);

    const filtered = filterClientsByCustomSegment(clients, segment);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(c => c.id)).toContain('equal');
    expect(filtered.map(c => c.id)).toContain('greater');
  });

  it('should handle not_equals operator', () => {
    const clients = [
      createMockClient({
        id: 'gold',
        loyaltyInfo: { ...createMockClient().loyaltyInfo!, tier: 'gold' },
      }),
      createMockClient({
        id: 'bronze',
        loyaltyInfo: { ...createMockClient().loyaltyInfo!, tier: 'bronze' },
      }),
    ];

    const segment = createMockCustomSegment([
      { field: 'loyaltyInfo.tier', operator: 'not_equals', value: 'bronze' },
    ]);

    const filtered = filterClientsByCustomSegment(clients, segment);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('gold');
  });
});
