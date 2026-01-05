/**
 * Client Segmentation Configuration
 * PRD Reference: 2.3.10 Client Segmentation
 */

import type {
  Client,
  ClientSegment,
  CustomSegment,
  SegmentFilterGroup,
  SegmentFilterCondition,
  SegmentFilterField as TypesFilterField,
  SegmentAnalytics,
  SegmentWithCount,
} from '../types/client';

// ==================== TYPES ====================

/** Configurable thresholds for default segments */
export interface SegmentThresholds {
  /** Days since last visit to be considered "active" */
  activeDays: number;
  /** Days since last visit to be considered "at risk" */
  atRiskDays: number;
  /** Days since last visit to be considered "lapsed" */
  lapsedDays: number;
  /** Days since first visit to be considered "new" */
  newClientDays: number;
  /** Percentile for VIP status (top X% by spend) */
  vipPercentile: number;
}

// Re-export types from client.ts for convenience
export type {
  CustomSegment,
  SegmentFilterGroup,
  SegmentFilterCondition,
  SegmentAnalytics,
  SegmentWithCount,
} from '../types/client';

// ==================== DEFAULT SETTINGS ====================

export const DEFAULT_SEGMENT_THRESHOLDS: SegmentThresholds = {
  activeDays: 60,
  atRiskDays: 90,
  lapsedDays: 90, // Same as at_risk end threshold
  newClientDays: 30,
  vipPercentile: 10, // Top 10%
};

/** Default segment colors */
export const SEGMENT_COLORS: Record<ClientSegment, string> = {
  active: '#22c55e',    // green-500
  at_risk: '#f97316',   // orange-500
  lapsed: '#ef4444',    // red-500
  vip: '#a855f7',       // purple-500
  new: '#3b82f6',       // blue-500
  member: '#06b6d4',    // cyan-500
  blocked: '#6b7280',   // gray-500
};

/** Default segment definitions */
export const DEFAULT_SEGMENT_DEFINITIONS: Record<ClientSegment, {
  name: string;
  description: string;
  priority: number;
}> = {
  blocked: {
    name: 'Blocked',
    description: 'Currently blocked from booking',
    priority: 1,
  },
  vip: {
    name: 'VIP',
    description: 'Top 10% by lifetime spend',
    priority: 2,
  },
  member: {
    name: 'Member',
    description: 'Has active membership',
    priority: 3,
  },
  new: {
    name: 'New',
    description: 'First visit within last 30 days',
    priority: 4,
  },
  active: {
    name: 'Active',
    description: 'Visited within last 60 days',
    priority: 5,
  },
  at_risk: {
    name: 'At Risk',
    description: '60-90 days since last visit',
    priority: 6,
  },
  lapsed: {
    name: 'Lapsed',
    description: '90+ days since last visit',
    priority: 7,
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate days since a date
 */
export function daysSince(dateString: string | undefined): number {
  if (!dateString) return Infinity;
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate VIP threshold based on percentile
 * Returns the minimum spend amount to be in top X%
 */
export function calculateVipThreshold(
  clients: Client[],
  percentile: number = DEFAULT_SEGMENT_THRESHOLDS.vipPercentile
): number {
  if (clients.length === 0) return Infinity;

  // Get all lifetime spends
  const spends = clients
    .map(c => c.visitSummary?.totalSpent || 0)
    .filter(s => s > 0)
    .sort((a, b) => b - a); // Sort descending

  if (spends.length === 0) return Infinity;

  // Calculate index for percentile
  const index = Math.ceil(spends.length * (percentile / 100)) - 1;
  return spends[Math.max(0, index)] || 0;
}

/**
 * Check if client qualifies as VIP
 */
export function isClientVip(
  client: Client,
  vipThreshold: number
): boolean {
  // If explicitly marked as VIP, always true
  if (client.isVip) return true;

  // Check if meets spend threshold
  const totalSpent = client.visitSummary?.totalSpent || 0;
  return totalSpent >= vipThreshold && vipThreshold > 0;
}

/**
 * Determine primary segment for a client
 * Uses priority order from DEFAULT_SEGMENT_DEFINITIONS
 */
export function getClientPrimarySegment(
  client: Client,
  thresholds: SegmentThresholds = DEFAULT_SEGMENT_THRESHOLDS,
  vipThreshold?: number
): ClientSegment {
  // Priority 1: Blocked
  if (client.isBlocked) {
    return 'blocked';
  }

  // Priority 2: VIP (either marked or by spend)
  if (vipThreshold !== undefined && isClientVip(client, vipThreshold)) {
    return 'vip';
  }
  if (client.isVip) {
    return 'vip';
  }

  // Priority 3: Member
  if (client.membership?.hasMembership) {
    return 'member';
  }

  // Calculate days since last visit
  const lastVisitDays = daysSince(client.visitSummary?.lastVisitDate);
  const createdDays = daysSince(client.createdAt);
  const totalVisits = client.visitSummary?.totalVisits || 0;

  // Priority 4: New (first visit within 30 days)
  if (totalVisits <= 1 && (lastVisitDays <= thresholds.newClientDays || createdDays <= thresholds.newClientDays)) {
    return 'new';
  }

  // Priority 5-7: Activity-based
  if (lastVisitDays <= thresholds.activeDays) {
    return 'active';
  }
  if (lastVisitDays <= thresholds.atRiskDays) {
    return 'at_risk';
  }

  return 'lapsed';
}

/**
 * Get all applicable segments for a client
 * A client can belong to multiple segments
 */
export function getClientAllSegments(
  client: Client,
  thresholds: SegmentThresholds = DEFAULT_SEGMENT_THRESHOLDS,
  vipThreshold?: number
): ClientSegment[] {
  const segments: ClientSegment[] = [];

  // Blocked
  if (client.isBlocked) {
    segments.push('blocked');
  }

  // VIP
  if (vipThreshold !== undefined && isClientVip(client, vipThreshold)) {
    segments.push('vip');
  } else if (client.isVip) {
    segments.push('vip');
  }

  // Member
  if (client.membership?.hasMembership) {
    segments.push('member');
  }

  // Calculate days since last visit
  const lastVisitDays = daysSince(client.visitSummary?.lastVisitDate);
  const createdDays = daysSince(client.createdAt);
  const totalVisits = client.visitSummary?.totalVisits || 0;

  // New
  if (totalVisits <= 1 && (lastVisitDays <= thresholds.newClientDays || createdDays <= thresholds.newClientDays)) {
    segments.push('new');
  }

  // Activity-based (mutually exclusive)
  if (lastVisitDays <= thresholds.activeDays) {
    segments.push('active');
  } else if (lastVisitDays <= thresholds.atRiskDays) {
    segments.push('at_risk');
  } else {
    segments.push('lapsed');
  }

  return segments;
}

/**
 * Calculate segment counts for all clients
 */
export function calculateSegmentCounts(
  clients: Client[],
  thresholds: SegmentThresholds = DEFAULT_SEGMENT_THRESHOLDS
): Record<ClientSegment, number> {
  // Calculate VIP threshold once
  const vipThreshold = calculateVipThreshold(clients, thresholds.vipPercentile);

  const counts: Record<ClientSegment, number> = {
    active: 0,
    at_risk: 0,
    lapsed: 0,
    vip: 0,
    new: 0,
    member: 0,
    blocked: 0,
  };

  for (const client of clients) {
    const segment = getClientPrimarySegment(client, thresholds, vipThreshold);
    counts[segment]++;
  }

  return counts;
}

/**
 * Get segment analytics with counts and percentages
 */
export function getSegmentAnalytics(
  clients: Client[],
  thresholds: SegmentThresholds = DEFAULT_SEGMENT_THRESHOLDS
): SegmentAnalytics {
  const totalClients = clients.length;
  const counts = calculateSegmentCounts(clients, thresholds);

  const segmentCounts: SegmentWithCount[] = (Object.keys(counts) as ClientSegment[]).map(segment => ({
    segment,
    name: DEFAULT_SEGMENT_DEFINITIONS[segment].name,
    count: counts[segment],
    percentage: totalClients > 0 ? Math.round((counts[segment] / totalClients) * 100) : 0,
    color: SEGMENT_COLORS[segment],
  }));

  // Sort by priority
  segmentCounts.sort((a, b) => {
    const priorityA = DEFAULT_SEGMENT_DEFINITIONS[a.segment as ClientSegment]?.priority || 99;
    const priorityB = DEFAULT_SEGMENT_DEFINITIONS[b.segment as ClientSegment]?.priority || 99;
    return priorityA - priorityB;
  });

  return {
    totalClients,
    segmentCounts,
    customSegmentCounts: [], // Custom segments are added by the caller
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Filter clients by segment
 */
export function filterClientsBySegment(
  clients: Client[],
  segment: ClientSegment,
  thresholds: SegmentThresholds = DEFAULT_SEGMENT_THRESHOLDS
): Client[] {
  const vipThreshold = calculateVipThreshold(clients, thresholds.vipPercentile);

  return clients.filter(client => {
    const clientSegments = getClientAllSegments(client, thresholds, vipThreshold);
    return clientSegments.includes(segment);
  });
}

/**
 * Filter clients by multiple segments (OR logic)
 */
export function filterClientsBySegments(
  clients: Client[],
  segments: ClientSegment[],
  thresholds: SegmentThresholds = DEFAULT_SEGMENT_THRESHOLDS
): Client[] {
  if (segments.length === 0) return clients;

  const vipThreshold = calculateVipThreshold(clients, thresholds.vipPercentile);

  return clients.filter(client => {
    const clientSegments = getClientAllSegments(client, thresholds, vipThreshold);
    return segments.some(s => clientSegments.includes(s));
  });
}

// ==================== CUSTOM SEGMENT EVALUATION ====================

/**
 * Get field value from client for filter evaluation
 * Uses dotted path notation matching SegmentFilterField type in client.ts
 */
function getClientFieldValue(client: Client, field: TypesFilterField): unknown {
  switch (field) {
    // Visit summary fields
    case 'visitSummary.totalVisits':
      return client.visitSummary?.totalVisits || 0;
    case 'visitSummary.totalSpent':
      return client.visitSummary?.totalSpent || 0;
    case 'visitSummary.averageTicket':
      return client.visitSummary?.averageTicket || 0;
    case 'visitSummary.lastVisitDate':
      return client.visitSummary?.lastVisitDate;
    case 'visitSummary.noShowCount':
      return client.visitSummary?.noShowCount || 0;
    case 'visitSummary.lateCancelCount':
      return client.visitSummary?.lateCancelCount || 0;
    // Loyalty fields
    case 'loyaltyInfo.tier':
      return client.loyaltyInfo?.tier || 'bronze';
    case 'loyaltyInfo.pointsBalance':
      return client.loyaltyInfo?.pointsBalance || 0;
    case 'loyaltyInfo.lifetimePoints':
      return client.loyaltyInfo?.lifetimePoints || 0;
    // Membership
    case 'membership.hasMembership':
      return client.membership?.hasMembership || false;
    // Simple fields
    case 'source':
      return client.source;
    case 'gender':
      return client.gender;
    case 'birthday':
      return client.birthday;
    case 'tags':
      return client.tags?.map(t => t.id) || [];
    case 'isVip':
      return client.isVip;
    case 'isBlocked':
      return client.isBlocked;
    case 'createdAt':
      return client.createdAt;
    default:
      return undefined;
  }
}

/**
 * Evaluate a single filter condition
 */
function evaluateCondition(client: Client, condition: SegmentFilterCondition): boolean {
  const value = getClientFieldValue(client, condition.field as TypesFilterField);
  const targetValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return value === targetValue;
    case 'not_equals':
      return value !== targetValue;
    case 'greater_than':
      return typeof value === 'number' && typeof targetValue === 'number' && value > targetValue;
    case 'less_than':
      return typeof value === 'number' && typeof targetValue === 'number' && value < targetValue;
    case 'greater_or_equal':
      return typeof value === 'number' && typeof targetValue === 'number' && value >= targetValue;
    case 'less_or_equal':
      return typeof value === 'number' && typeof targetValue === 'number' && value <= targetValue;
    case 'contains':
      if (Array.isArray(value) && typeof targetValue === 'string') {
        return value.includes(targetValue);
      }
      if (typeof value === 'string' && typeof targetValue === 'string') {
        return value.toLowerCase().includes(targetValue.toLowerCase());
      }
      return false;
    case 'not_contains':
      if (Array.isArray(value) && typeof targetValue === 'string') {
        return !value.includes(targetValue);
      }
      if (typeof value === 'string' && typeof targetValue === 'string') {
        return !value.toLowerCase().includes(targetValue.toLowerCase());
      }
      return true;
    case 'starts_with':
      if (typeof value === 'string' && typeof targetValue === 'string') {
        return value.toLowerCase().startsWith(targetValue.toLowerCase());
      }
      return false;
    case 'ends_with':
      if (typeof value === 'string' && typeof targetValue === 'string') {
        return value.toLowerCase().endsWith(targetValue.toLowerCase());
      }
      return false;
    case 'in_list':
      if (Array.isArray(targetValue)) {
        return targetValue.includes(value as string);
      }
      return false;
    case 'not_in_list':
      if (Array.isArray(targetValue)) {
        return !targetValue.includes(value as string);
      }
      return true;
    case 'is_empty':
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'string') return value.length === 0;
      return value === null || value === undefined;
    case 'is_not_empty':
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.length > 0;
      return value !== null && value !== undefined;
    default:
      return false;
  }
}

/**
 * Evaluate a filter group (recursive)
 */
function evaluateFilterGroup(client: Client, group: SegmentFilterGroup): boolean {
  const results = group.conditions.map(condition => {
    if ('logic' in condition) {
      // Nested group
      return evaluateFilterGroup(client, condition as SegmentFilterGroup);
    }
    return evaluateCondition(client, condition as SegmentFilterCondition);
  });

  if (group.logic === 'and') {
    return results.every(r => r);
  }
  return results.some(r => r);
}

/**
 * Filter clients by custom segment
 */
export function filterClientsByCustomSegment(
  clients: Client[],
  segment: CustomSegment
): Client[] {
  if (!segment.isActive) return [];
  return clients.filter(client => evaluateFilterGroup(client, segment.filters));
}

/**
 * Count clients matching a custom segment
 */
export function countCustomSegmentClients(
  clients: Client[],
  segment: CustomSegment
): number {
  return filterClientsByCustomSegment(clients, segment).length;
}

// ==================== SEGMENT ACTIONS ====================

/** Export format for segment data */
export type ExportFormat = 'csv' | 'xlsx' | 'json';

/**
 * Generate CSV content for segment export
 */
export function generateSegmentExportCsv(clients: Client[]): string {
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Total Visits',
    'Total Spent',
    'Last Visit',
    'Loyalty Tier',
    'Tags',
    'Segment',
  ];

  const rows = clients.map(client => {
    const segment = getClientPrimarySegment(client);
    return [
      client.firstName,
      client.lastName,
      client.email || '',
      client.phone,
      String(client.visitSummary?.totalVisits || 0),
      String(client.visitSummary?.totalSpent || 0),
      client.visitSummary?.lastVisitDate || '',
      client.loyaltyInfo?.tier || 'bronze',
      client.tags?.map(t => t.name).join('; ') || '',
      DEFAULT_SEGMENT_DEFINITIONS[segment].name,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Get segment action summary
 */
export interface SegmentActionSummary {
  segment: ClientSegment | string;
  clientCount: number;
  emailCount: number;
  phoneCount: number;
  canEmail: boolean;
  canSms: boolean;
}

export function getSegmentActionSummary(clients: Client[], segmentId: ClientSegment | string): SegmentActionSummary {
  const segmentClients = (Object.values(DEFAULT_SEGMENT_DEFINITIONS).map((_, i) =>
    (Object.keys(DEFAULT_SEGMENT_DEFINITIONS) as ClientSegment[])[i]
  ) as ClientSegment[]).includes(segmentId as ClientSegment)
    ? filterClientsBySegment(clients, segmentId as ClientSegment)
    : clients;

  const emailCount = segmentClients.filter(c => c.email && c.communicationPreferences?.allowEmail !== false).length;
  const phoneCount = segmentClients.filter(c => c.phone && c.communicationPreferences?.allowSms !== false).length;

  return {
    segment: segmentId,
    clientCount: segmentClients.length,
    emailCount,
    phoneCount,
    canEmail: emailCount > 0,
    canSms: phoneCount > 0,
  };
}
